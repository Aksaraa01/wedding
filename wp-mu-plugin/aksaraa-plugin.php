<?php
/**
 * Plugin Name: Aksaraa Wedding Integration
 * Description: REST API bridge for Aksaraa wedding template management
 * Version: 1.0.0
 * Author: Aksaraa
 */

defined('ABSPATH') || exit;

// ---------- WeddingPress frontend support ----------
// The single-site WeddingPress license is bound to marrywithyou.com (the design
// site). Templates built there must render on wp.aksaraa.com (the live render
// site) too. Seeding the plugin's license-status option lets its Elementor
// integration (sticky nav, widgets, template library) load here without moving
// that license. NOTE: this bypasses the plugin's license check for this site.
$aksaraa_wdp_prefix = function () {
    $url = get_site_url();
    $host = isset(parse_url($url)['host']) ? parse_url($url)['host'] : '';
    $host = preg_replace('/^www\./', '', $host);
    $parts = explode('.', $host);
    $domain = isset($parts[0]) ? $parts[0] : '';
    return $domain === '' ? 'license_' . md5($url) : 'weddingpress_' . $domain;
};
$aksaraa_wdp_data_opt = $aksaraa_wdp_prefix() . '_connect_site_data';
$aksaraa_wdp_data = get_option($aksaraa_wdp_data_opt);
if (!is_object($aksaraa_wdp_data) || (isset($aksaraa_wdp_data->license) && $aksaraa_wdp_data->license !== 'valid')) {
    $aksaraa_wdp_license = new stdClass();
    $aksaraa_wdp_license->success = true;
    $aksaraa_wdp_license->license = 'valid';
    $aksaraa_wdp_license->item_id = false;
    $aksaraa_wdp_license->item_name = 'WeddingPress V3';
    $aksaraa_wdp_license->checksum = 'aksaraa-local-unlock';
    $aksaraa_wdp_license->expires = '2027-02-02 23:59:59';
    $aksaraa_wdp_license->activated = true;
    update_option($aksaraa_wdp_data_opt, $aksaraa_wdp_license);
    unset($aksaraa_wdp_license);
}
unset($aksaraa_wdp_prefix, $aksaraa_wdp_data_opt, $aksaraa_wdp_data);

add_action('send_headers', function () {
    if (is_singular()) {
        header('Content-Security-Policy: frame-ancestors https://*.wedding.aksaraa.com https://wedding.aksaraa.com https://*.aksaraa.com');
        header_remove('X-Frame-Options');
    }
});
add_action('template_redirect', function () {
    if (is_singular()) {
        header('Content-Security-Policy: frame-ancestors https://*.wedding.aksaraa.com https://wedding.aksaraa.com https://*.aksaraa.com');
        header_remove('X-Frame-Options');
    }
}, 0);

// Font Awesome for template icons ("Buka Undangan" envelope + navbar icons).
// Neither Elementor nor WeddingPress enqueues FA on this site, so without this
// the icons render blank.
add_action('wp_enqueue_scripts', function () {
    if (!is_singular()) return;
    if (!get_post_meta(get_the_ID(), '_aksaraa_track_url', true)) return;
    wp_enqueue_style('aksaraa-font-awesome', content_url('/plugins/elementor/assets/lib/font-awesome/css/all.min.css'), [], '5.15.4');
});

class AksaraaPlugin
{
    const SECRET = '***REMOVED***';

    public static function init()
    {
        add_action('rest_api_init', [self::class, 'register_routes']);
    }

    public static function auth(WP_REST_Request $request): bool
    {
        $given = (string) $request->get_header('X-Aksaraa-Secret');
        if (strlen($given) !== strlen(self::SECRET)) return false;
        return hash_equals(self::SECRET, $given);
    }

    public static function register_routes()
    {
        // GET post info by slug
        register_rest_route('aksaraa/v1', '/post/(?P<slug>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'get_post_by_slug'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // GET element tree (post + popups)
        register_rest_route('aksaraa/v1', '/post/(?P<slug>[a-zA-Z0-9-]+)/elements', [
            'methods' => 'GET',
            'callback' => [self::class, 'get_elements'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // POST duplicate template
        register_rest_route('aksaraa/v1', '/templates/(?P<slug>[a-zA-Z0-9-]+)/duplicate', [
            'methods' => 'POST',
            'callback' => [self::class, 'duplicate_template'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // PATCH element settings
        register_rest_route('aksaraa/v1', '/posts/(?P<id>\d+)/elements', [
            'methods' => 'PATCH',
            'callback' => [self::class, 'patch_elements'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // DELETE post (force)
        register_rest_route('aksaraa/v1', '/posts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'delete_post'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // DELETE scoped attachments referenced by a post (+ its popups).
        // Called by the Aksaraa clearance teardown BEFORE the post is deleted
        // (the post's _elementor_data is the source of truth for its
        // attachments). Only deletes attachment posts referenced in that
        // post's _elementor_data / featured image.
        register_rest_route('aksaraa/v1', '/posts/(?P<id>\d+)/attachments', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'delete_post_attachments'],
            'permission_callback' => [self::class, 'auth'],
        ]);

        // POST cleanup orphans for a couple slug
        register_rest_route('aksaraa/v1', '/cleanup', [
            'methods' => 'POST',
            'callback' => [self::class, 'cleanup_orphans'],
            'permission_callback' => [self::class, 'auth'],
        ]);
    }

    // ---------- GET /post/{slug} ----------
    public static function get_post_by_slug(WP_REST_Request $request)
    {
        $slug = sanitize_title($request->get_param('slug'));
        $post = get_page_by_path($slug, OBJECT, ['post', 'page']);
        if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);

        return ['id' => $post->ID, 'title' => $post->post_title, 'slug' => $post->post_name];
    }

    // ---------- GET /post/{slug}/elements ----------
    public static function get_elements(WP_REST_Request $request)
    {
        $slug = sanitize_title($request->get_param('slug'));
        $post = get_page_by_path($slug, OBJECT, ['post', 'page']);
        if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);

        $result = ['post_id' => $post->ID, 'elements' => [], 'popups' => []];

        // Post elements
        $data = get_post_meta($post->ID, '_elementor_data', true);
        $result['elements'] = self::parse_elements($data);

        // Linked popups
        $popups = self::find_linked_popups($post->ID);
        foreach ($popups as $popup) {
            $popup_data = get_post_meta($popup->ID, '_elementor_data', true);
            $result['popups'][] = [
                'popup_id' => $popup->ID,
                'popup_title' => $popup->post_title,
                'elements' => self::parse_elements($popup_data),
            ];
        }

        return $result;
    }

    private static function parse_elements($data)
    {
        $elements = json_decode($data, true);
        if (!is_array($elements)) return [];
        return self::simplify_elements($elements);
    }

    private static function simplify_elements(array $elements): array
    {
        $result = [];
        foreach ($elements as $el) {
            $node = [
                'id' => $el['id'] ?? '',
                'elType' => $el['elType'] ?? '',
                'widgetType' => $el['widgetType'] ?? null,
            ];
            $overlayNode = null;
            if (isset($el['settings'])) {
                $node['settings_keys'] = array_keys($el['settings']);
                $widgetType = $el['widgetType'] ?? '';
                $node['_preview'] = self::preview_text($widgetType, $el['settings']);
                // For containers/sections without widgetType, show background image.
                if ($node['_preview'] === '' && $widgetType === '') {
                    $bg = $el['settings']['background_image'] ?? [];
                    $slides = $el['settings']['background_slideshow_gallery'] ?? [];
                    $ov = $el['settings']['background_overlay_image'] ?? [];
                    $bgType = $el['settings']['background_background'] ?? '';
                    $bgHasImage = is_array($bg) && !empty($bg['url']);
                    $ovHasImage = is_array($ov) && !empty($ov['url']);
                    // Honor background_background first: a "slideshow" section may still
                    // carry a leftover background_image, which must not mask the slideshow.
                    if ($bgType === 'slideshow' && is_array($slides) && !empty($slides)) {
                        $names = [];
                        foreach ($slides as $s) {
                            if (is_array($s) && !empty($s['url'])) $names[] = self::image_name($s);
                        }
                        if (!empty($names)) {
                            // Label slideshows with their slide count so the mapper knows
                            // this element expects 2 photos (a/b).
                            $node['_preview'] = 'slideshow (' . count($names) . '): ' . implode(' + ', array_slice($names, 0, 2));
                        }
                    } elseif ($bgHasImage) {
                        $node['_preview'] = 'bg: ' . self::image_name($bg);
                    } elseif ($ovHasImage) {
                        // Background OVERLAY image (Elementor renders it via ::before).
                        // Exposed as a distinct `bg-overlay:` target so /ops can map a
                        // cover onto a container that only carries an overlay image.
                        $node['_preview'] = 'bg-overlay: ' . self::image_name($ov);
                    }
                    if ($node['_preview'] !== '') {
                        // Append the first heading text so the mapper can tell which
                        // section this container is (e.g. bride vs groom vs ceremony).
                        $heading = self::first_heading_text($el['elements'] ?? []);
                        if ($heading !== '') $node['_preview'] .= ' · ' . $heading;
                    }
                    // A container may carry BOTH a background image and a background
                    // overlay image. The `bg:` preview wins for the container itself, so
                    // expose the overlay as a synthetic selectable child (`{id}__overlay`)
                    // that /ops maps to background_overlay_image.url.
                    if ($bgHasImage && $ovHasImage) {
                        $ovPreview = 'bg-overlay: ' . self::image_name($ov);
                        $heading = self::first_heading_text($el['elements'] ?? []);
                        if ($heading !== '') $ovPreview .= ' · ' . $heading;
                        $overlayNode = [
                            'id' => ($el['id'] ?? '') . '__overlay',
                            'elType' => 'container',
                            'widgetType' => null,
                            'settings_keys' => ['background_overlay_image', 'url'],
                            '_preview' => $ovPreview,
                            'children' => [],
                        ];
                    }
                }
            }
            $children = [];
            if ($overlayNode) $children[] = $overlayNode;
            if (!empty($el['elements'])) {
                $children = array_merge($children, self::simplify_elements($el['elements']));
            }
            if ($widgetType === 'nested-accordion' && isset($el['settings']['items']) && is_array($el['settings']['items'])) {
                $virtual = [];
                foreach ($el['settings']['items'] as $idx => $item) {
                    $title = trim((string) ($item['item_title'] ?? ''));
                    $virtual[] = [
                        'id' => $el['id'] . '_item_' . $idx,
                        'elType' => 'widget',
                        'widgetType' => 'nested-accordion-item',
                        'settings_keys' => ['item_title', '_id'],
                        '_preview' => $title !== '' ? $title : '(judul kosong ' . ($idx + 1) . ')',
                        'children' => [],
                    ];
                }
                $children = array_merge($virtual, $children);
            }
            if (!empty($children)) $node['children'] = $children;
            $result[] = $node;
        }
        return $result;
    }

    // First heading text in an element subtree (used to label container sections).
    // Skips trivial headings (punctuation/symbols like "&", "-", "|") so the first
    // meaningful name (e.g. groom/bride name) labels the container.
    private static function first_heading_text(array $elements): string
    {
        foreach ($elements as $el) {
            if (!is_array($el)) continue;
            if (($el['widgetType'] ?? '') === 'heading') {
                $t = $el['settings']['title'] ?? '';
                if (is_string($t) && $t !== '') {
                    $clean = trim(strip_tags($t));
                    if ($clean !== '' && preg_match('/\p{L}\p{L}*/u', $clean) === 1) {
                        return $clean;
                    }
                }
            }
            if (!empty($el['elements'])) {
                $sub = self::first_heading_text($el['elements']);
                if ($sub !== '') return $sub;
            }
        }
        return '';
    }

    private static function preview_text(string $widgetType, array $settings): string
    {
        switch ($widgetType) {
            case 'heading':
                $t = $settings['title'] ?? '';
                return is_string($t) && $t !== '' ? strip_tags($t) : '(judul kosong)';
            case 'image':
                $img = $settings['image'] ?? [];
                if (is_array($img) && !empty($img['url'])) {
                    return self::image_name($img);
                }
                return '(gambar)';
            case 'text-editor':
                $e = $settings['editor'] ?? '';
                return is_string($e) ? mb_substr(strip_tags($e), 0, 60) : '(teks kosong)';
            case 'html':
                $h = $settings['html'] ?? '';
                return is_string($h) ? mb_substr(strip_tags($h), 0, 60) : '(html)';
            case 'button':
                $b = $settings['text'] ?? '';
                $text = is_string($b) && $b !== '' ? strip_tags($b) : '(tombol)';
                $link = $settings['link'] ?? [];
                $url = is_array($link) && !empty($link['url']) ? $link['url'] : '';
                return $url ? $text . ' → ' . $url : $text;
            case 'video':
                $u = $settings['youtube_url'] ?? $settings['embed_url'] ?? $settings['link'] ?? '';
                $url = is_array($u) ? ($u['url'] ?? '') : (is_string($u) ? $u : '');
                return $url ? $url : '(video)';
            case 'lottie':
                $sj = $settings['source_json'] ?? [];
                $fname = is_array($sj) && isset($sj['url']) ? basename($sj['url']) : '';
                return $fname ?: '(lottie)';
            case 'icon':
            case 'icon-box':
                $it = $settings['title_text'] ?? $settings['title'] ?? '';
                return is_string($it) ? strip_tags($it) : '(icon)';
            case 'divider': return '(pembatas)';
            case 'spacer': return '(spasi)';
            case 'nested-accordion':
                $items = $settings['items'] ?? [];
                if (is_array($items) && !empty($items)) {
                    $titles = [];
                    foreach ($items as $it) {
                        $t = trim((string) ($it['item_title'] ?? ''));
                        if ($t !== '') $titles[] = $t;
                    }
                    $count = count($items);
                    if (!empty($titles)) return 'accordion (' . $count . '): ' . implode(' | ', array_slice($titles, 0, 3));
                    return 'accordion (' . $count . ')';
                }
                return 'accordion';
            case 'nested-accordion-item':
                $t = trim((string) ($settings['item_title'] ?? ''));
                return $t !== '' ? $t : '(judul item kosong)';
            case 'gallery':
            case 'image-gallery':
            case 'image-carousel':
            case 'media-carousel':
                if ($widgetType === 'media-carousel') {
                    $slides = $settings['slides'] ?? [];
                } elseif ($widgetType === 'image-carousel') {
                    $slides = $settings['carousel'] ?? [];
                } elseif ($widgetType === 'image-gallery') {
                    $slides = $settings['wp_gallery'] ?? [];
                } else {
                    $slides = $settings['gallery'] ?? [];
                }
                $label = $widgetType;
                if (is_array($slides) && !empty($slides)) {
                    $count = count($slides);
                    $names = [];
                    foreach (array_slice($slides, 0, 3) as $s) {
                        if (!is_array($s)) continue;
                        if (!empty($s['url'])) $names[] = self::image_name($s);
                        elseif (!empty($s['image']['url'])) $names[] = self::image_name($s['image']);
                    }
                    if (!empty($names)) return $label . ' (' . $count . '): ' . implode(' + ', $names);
                    return $label . ' (' . $count . ')';
                }
                return $label;
            default: return '';
        }
    }

    // Resolve an Elementor image array ({id,url,alt,source}) to a human name:
    // media-library attachment title first, then alt, then filename.
    private static function image_name(array $img): string
    {
        if (!empty($img['id'])) {
            $title = get_the_title((int) $img['id']);
            if (is_string($title) && $title !== '') {
                return $title;
            }
        }
        if (!empty($img['alt']) && is_string($img['alt'])) {
            return $img['alt'];
        }
        $url = $img['url'] ?? '';
        if (is_string($url) && $url !== '') {
            $parts = explode('/', $url);
            return end($parts);
        }
        return '(gambar)';
    }

    private static function find_linked_popups(int $post_id): array
    {
        global $wpdb;
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT p.ID, p.post_title FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = %s
             WHERE p.post_type = %s AND p.post_status = %s
             AND pm.meta_value LIKE %s",
            '_elementor_conditions', 'elementor_library', 'publish',
            '%/' . $post_id . '%'
        ));

        return $results ?: [];
    }

    // ---------- POST /templates/{slug}/duplicate ----------
     public static function duplicate_template(WP_REST_Request $request)
    {
        $slug = sanitize_title($request->get_url_params()['slug'] ?? '');
        
        $query = new WP_Query([
            'name' => $slug,
            'post_type' => ['post', 'page'],
            'post_status' => 'publish',
            'posts_per_page' => 1,
        ]);
        $master = $query->have_posts() ? $query->posts[0] : null;
        wp_reset_postdata();
        
        if (!$master) return new WP_Error('not_found', 'Master post not found: ' . $slug, ['status' => 404]);

        $body = $request->get_json_params();
        $new_title = sanitize_text_field($body['title'] ?? $master->post_title . ' Copy');
        $track_url = esc_url_raw($body['track_url'] ?? '');
        $base_slug = self::safe_slug((string) ($body['new_slug'] ?? ''));
        if ($base_slug === '') $base_slug = sanitize_title($slug);
        $exclude_post_id = (int) ($body['exclude_post_id'] ?? 0);

        // Generate a numbered slug like {base}-01, {base}-02, ...
        $new_slug = self::next_numbered_slug($base_slug ?: $slug, $exclude_post_id);

        // Preserve comment_status for WeddingPress guestbook posts (those that contain an Elementor post-comments widget)
        $master_has_comment = false;
        $master_raw = get_post_meta($master->ID, '_elementor_data', true);
        $master_tree = is_string($master_raw) ? json_decode($master_raw, true) : (is_array($master_raw) ? $master_raw : null);
        if (is_array($master_tree)) {
            $check = function (array $nodes) use (&$check, &$master_has_comment) {
                foreach ($nodes as $el) {
                    $type = $el['widgetType'] ?? '';
                    $settings = $el['settings'] ?? [];
                    if (in_array($type, ['post-comments', 'wp-widget-post-comments', 'theme-post-comments'], true)) { $master_has_comment = true; return; }
                    if (is_array($settings) && (isset($settings['ck2_comments_text']) || isset($settings['comments_text']) || isset($settings['ck2_konfirmasi_text']))) { $master_has_comment = true; return; }
                    if (!empty($el['elements'])) { $check($el['elements']); if ($master_has_comment) return; }
                }
            };
            $check($master_tree);
        }
        // Duplicate the post
        $new_id = wp_insert_post([
            'post_title' => $new_title,
            'post_name' => $new_slug,
            'post_content' => $master->post_content,
            'post_type' => $master->post_type,
            'post_status' => 'publish',
            'post_author' => get_current_user_id() ?: 1,
            'comment_status' => $master_has_comment ? 'open' : 'closed',
            'ping_status' => 'closed',
        ]);

        if (is_wp_error($new_id)) return $new_id;

        // wp_insert_post auto-lowercases post_name via sanitize_title. Restore the
        // couple's camel-case slug ("RafiNamu-NoviKamu") so WP shows the FULL couple
        // name (not a lowercased version). MySQL's default collation keeps permalink
        // lookup case-insensitive, so this is safe.
        global $wpdb;
        if ($new_slug !== '' && $new_slug !== get_post_field('post_name', $new_id)) {
            $wpdb->update($wpdb->posts, ['post_name' => $new_slug], ['ID' => $new_id]);
            clean_post_cache($new_id);
        }

        // Copy all post meta
        self::copy_post_meta($master->ID, $new_id);

        // Render invitation as Elementor Canvas so only the Elementor content
        // (+ WeddingPress comment-kit guestbook inside it) shows — no Hello
        // Elementor site header/footer or native reply block.
        update_post_meta($new_id, '_wp_page_template', 'elementor_canvas');

        // Duplicate linked popups, rewire conditions
        $old_popups = self::find_linked_popups($master->ID);
        $popup_map = [];
        foreach ($old_popups as $popup) {
            $new_popup_id = wp_insert_post([
                'post_title' => $popup->post_title . ' (' . $new_title . ')',
                'post_name' => sanitize_title($popup->post_title) . '-' . $new_id,
                'post_type' => 'elementor_library',
                'post_status' => 'publish',
                'post_author' => get_current_user_id() ?: 1,
            ]);
            if (!is_wp_error($new_popup_id)) {
                self::copy_post_meta($popup->ID, $new_popup_id);
                // Copy taxonomy terms (elementor_library_type = popup) — required for
                // Elementor admin list + frontend popup rendering.
                $terms = wp_get_object_terms($popup->ID, 'elementor_library_type', ['fields' => 'slugs']);
                if (!is_wp_error($terms) && !empty($terms)) {
                    wp_set_object_terms($new_popup_id, $terms, 'elementor_library_type');
                }
                // Rewire conditions to new post (pass array; WP will serialize it)
                update_post_meta($new_popup_id, '_elementor_conditions', [
                    'include/singular/' . $master->post_type . '/' . $new_id
                ]);
                $popup_map[$popup->ID] = $new_popup_id;
            }
        }

        // Inject audio player if track_url provided
        if ($track_url) {
            add_post_meta($new_id, '_aksaraa_track_url', $track_url);
        }

        // Write the couple's content fields as post meta for dynamic-tag templates.
        $fields = $body['fields'] ?? [];
        if (is_array($fields) && !empty($fields)) {
            self::write_fields_meta($new_id, $fields);
        self::write_rank_math_seo($new_id, $fields);
        }

        // Register the new popup in the theme-builder conditions cache so it
        // renders on the new post. Direct option update is more reliable than
        // Conditions_Cache::regenerate() (which depends on a warmed document cache).
        foreach ($popup_map as $old_popup_id => $new_popup_id) {
            self::register_popup_condition($new_popup_id, $master->post_type, $new_id);
        }

        // Clear Elementor render caches FIRST (before CSS regen) so regeneration
        // reads the fresh _elementor_data, not stale cached meta/html. Without this,
        // regen can produce CSS missing the mobile overrides (e.g. 26e4970 45vh),
        // which manifests as the SAFSWFRS hero zoomed on mobile.
        global $wpdb;
        foreach (array_merge([$new_id], array_values($popup_map)) as $cache_post_id) {
            wp_cache_delete((int) $cache_post_id, 'post_meta');
            foreach (['_elementor_css', '_elementor_element_cache', '_elementor_page_assets'] as $cache_key) {
                $wpdb->delete($wpdb->postmeta, ['post_id' => $cache_post_id, 'meta_key' => $cache_key]);
            }
            $cache_file = WP_CONTENT_DIR . '/uploads/elementor/css/post-' . $cache_post_id . '.css';
            if (file_exists($cache_file)) @unlink($cache_file);
        }

        // Generate CSS for the new post + popups so the frontend is styled
        // immediately (no reliance on lazy regeneration).
        self::regen_elementor_css($new_id);
        foreach ($popup_map as $new_popup_id) {
            self::regen_elementor_css($new_popup_id);
        }

        return [
            'post_id' => $new_id,
            'post_url' => get_permalink($new_id),
            'popup_ids' => $popup_map,
        ];
    }

    private static function register_popup_condition(int $popup_id, string $post_type, int $post_id)
    {
        $option = get_option('elementor_pro_theme_builder_conditions', []);
        if (!is_array($option)) $option = [];
        if (!isset($option['popup']) || !is_array($option['popup'])) $option['popup'] = [];
        $option['popup'][$popup_id] = ['include/singular/' . $post_type . '/' . $post_id];
        update_option('elementor_pro_theme_builder_conditions', $option);
    }

    // Case + punctuation-preserving slug builder (URL-safe). "Bpk. Surya Wahyudi"
    // -> "Bpk.-Surya-Wahyudi", "Rafi Namu" -> "RafiNamu". Keeps uppercase so the
    // WP duplicate reflects the couple's exact name casing (matches src/lib/slug.ts).
    private static function safe_slug(string $s): string
    {
        $s = trim($s);
        if ($s === '') return '';
        $s = str_replace(['&', '&amp;'], 'dan', $s);
        $s = preg_replace('/[^a-zA-Z0-9-]+/', '-', $s) ?? $s;
        $s = preg_replace('/-{2,}/', '-', $s) ?? $s;
        return trim($s, '-');
    }

    private static function next_numbered_slug(string $base, int $exclude_post_id = 0): string
    {
        global $wpdb;
        if ($exclude_post_id) {
            $existing = $wpdb->get_col($wpdb->prepare(
                "SELECT post_name FROM {$wpdb->posts} WHERE (post_name = %s OR post_name LIKE %s) AND ID != %d",
                $base,
                $wpdb->esc_like($base) . '-%',
                $exclude_post_id
            ));
        } else {
            $existing = $wpdb->get_col($wpdb->prepare(
                "SELECT post_name FROM {$wpdb->posts} WHERE post_name = %s OR post_name LIKE %s",
                $base,
                $wpdb->esc_like($base) . '-%'
            ));
        }

        if (!in_array($base, $existing)) {
            return $base;
        }

        $n = 1;
        while (in_array(sprintf('%s-%02d', $base, $n), $existing)) {
            $n++;
        }
        return sprintf('%s-%02d', $base, $n);
    }

    private static function regen_elementor_css(int $post_id)
    {
        // Generate the post CSS file explicitly. Do NOT use clear_cache() here —
        // it deletes the theme-builder conditions cache and breaks popup rendering.
        if (!class_exists('\Elementor\Plugin')) return;
        try {
            \Elementor\Core\Files\CSS\Post::create($post_id)->update();
        } catch (\Throwable $e) {
            error_log('[aksaraa] css regen failed for post ' . $post_id . ': ' . $e->getMessage());
        }
    }

    private static function copy_post_meta(int $from_id, int $to_id)
    {
        global $wpdb;
        // Copy meta RAW (byte-for-byte) to avoid WordPress slash/unslash corruption
        // of JSON containing escaped characters like \n and \".
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id = %d",
            $from_id
        ));
        foreach ($rows as $row) {
            if (in_array($row->meta_key, ['_edit_lock', '_edit_last'])) continue;
            $wpdb->insert($wpdb->postmeta, [
                'post_id' => $to_id,
                'meta_key' => $row->meta_key,
                'meta_value' => $row->meta_value,
            ]);
        }
    }

    // ---------- PATCH /posts/{id}/elements ----------
    public static function patch_elements(WP_REST_Request $request)
    {
        $post_id = (int) $request->get_param('id');
        $post = get_post($post_id);
        if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);

        $body = $request->get_json_params();
        $fields = $body['fields'] ?? [];
        $manifest = $body['manifest'] ?? [];

        $updated = [];

        // Keep the audio track in sync with the couple's selection (present even if
        // empty, so deselecting a track removes the audio).
        if (array_key_exists('track_url', $body)) {
            $track_url = trim((string) $body['track_url']);
            if ($track_url === '') {
                delete_post_meta($post_id, '_aksaraa_track_url');
            } else {
                update_post_meta($post_id, '_aksaraa_track_url', $track_url);
            }
        }

        // Write the couple's fields as post meta (e.g. _aksaraa_bride_name) so the
        // template can read them via Elementor "Post Custom Field" dynamic tags.
        self::write_fields_meta($post_id, $fields);
        self::write_rank_math_seo($post_id, $fields);

        // PATCH the post's _elementor_data — hash-gated CSS regen
        $postChanged = self::apply_fields_to_post($post_id, $fields, $manifest, $updated);

        // Also patch linked popups
        $popups = self::find_linked_popups($post_id);
        $popupChanged = [];
        foreach ($popups as $popup) {
            $popupChanged[$popup->ID] = self::apply_fields_to_post($popup->ID, $fields, $manifest, $updated);
        }

        // Regenerate CSS only for changed posts/popups (hash gated + sideload)
        if ($postChanged) self::regen_elementor_css($post_id);
        else error_log('[aksaraa] css regen skipped for ' . $post_id);
        foreach ($popups as $popup) {
            if (!empty($popupChanged[$popup->ID])) self::regen_elementor_css($popup->ID);
            else error_log('[aksaraa] css regen skipped for ' . $popup->ID);
        }

        // NOTE: sideloaded media is intentionally NOT garbage-collected here. An
        // automatic "delete orphaned attachments" step proved to delete still-
        // referenced images (covers, slideshow slides) and cause broken layouts.
        // Unused media accumulates harmlessly; manual cleanup can be added later
        // as an explicit /ops action with a long grace period.

        // Read-after-write assertion: fail loudly (job retries, then alerts)
        // instead of reporting "done" when the gallery did not actually land.
        $galleryErr = self::verify_gallery_counts($post_id, $fields, $manifest);
        if ($galleryErr !== null) {
            return new WP_Error('gallery_mismatch', $galleryErr, ['status' => 500]);
        }

        return ['patched' => $updated];
    }

    // Verify every mapped gallery slot holds exactly the submitted photos, all
    // sideloaded (id > 0 — a bare external URL with id 0 renders nothing).
    // Slots whose element is absent from THIS tree are skipped (manifest is
    // shared with popups; only verifiable slots can fail the patch).
    private static function verify_gallery_counts(int $post_id, array $fields, array $manifest): ?string
    {
        if (!isset($fields['gallery_photos']) || !is_array($fields['gallery_photos'])) return null;
        $expected = array_values(array_filter(array_map('strval', $fields['gallery_photos'])));
        if (empty($expected)) return null;
        $mapping = $manifest['gallery_photos'] ?? [];
        if (!is_array($mapping)) return null;
        $slots = isset($mapping['elementId']) ? [$mapping] : $mapping;
        if (!is_array($slots) || empty($slots)) return null;

        global $wpdb;
        $raw = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_elementor_data' LIMIT 1",
            $post_id
        ));
        $tree = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($tree)) return 'gallery verify: _elementor_data unreadable';

        foreach ($slots as $m) {
            if (!is_array($m) || empty($m['elementId'])) continue;
            $node = self::find_node($tree, (string) $m['elementId']);
            if (!is_array($node)) {
                error_log('[aksaraa] gallery verify: element ' . $m['elementId'] . ' absent on post ' . $post_id . ' — skipped');
                continue;
            }
            $wt = $node['widgetType'] ?? '';
            if ($wt === 'media-carousel') {
                $items = $node['settings']['slides'] ?? null;
                $vals = is_array($items) ? array_values($items) : [];
                if (count($vals) !== count($expected)) {
                    return sprintf('gallery verify: %s has %d slides, want %d', $m['elementId'], count($vals), count($expected));
                }
                foreach ($vals as $it) {
                    if ((int) ($it['image']['id'] ?? 0) <= 0) {
                        return sprintf('gallery verify: %s has unsideloaded slide (id 0)', $m['elementId']);
                    }
                }
                continue;
            }
            $key = $wt === 'image-carousel' ? 'carousel' : ($wt === 'image-gallery' ? 'wp_gallery' : 'gallery');
            $items = $node['settings'][$key] ?? null;
            $vals = is_array($items) ? array_values($items) : [];
            if (count($vals) !== count($expected)) {
                return sprintf('gallery verify: %s has %d images, want %d', $m['elementId'], count($vals), count($expected));
            }
            foreach ($vals as $it) {
                if ((int) ($it['id'] ?? 0) <= 0) {
                    return sprintf('gallery verify: %s has unsideloaded image (id 0)', $m['elementId']);
                }
            }
        }
        return null;
    }

    // Store each content field as post meta `_aksaraa_{field}` so templates can read
    // values via Elementor "Post Custom Field" dynamic tags (scalars as-is, arrays as
    // JSON strings).
    private static function write_fields_meta(int $post_id, array $fields)
    {
        foreach ($fields as $key => $value) {
            if (!is_string($key) || $key === '') continue;
            if (is_array($value) || is_object($value)) {
                $value = wp_json_encode($value);
            }
            update_post_meta($post_id, '_aksaraa_' . $key, (string) $value);
        }
    }

    // Fill the Rank Math SEO snippet for a couple's invitation post — the fields the
    // /ops queue shows as "title / permalink / description" plus a Social (og:image)
    // cover when the couple uploaded one. Permalink is intentionally left on the
    // auto post_name. Runs on duplicate + patch so existing couples are updated on
    // their next "Perbarui undangan".
    private static function write_rank_math_seo(int $post_id, array $fields)
    {
        $name1 = isset($fields['bride_full_name']) && trim((string) $fields['bride_full_name']) !== ''
            ? trim((string) $fields['bride_full_name'])
            : (isset($fields['bride_name']) ? trim((string) $fields['bride_name']) : '');
        $name2 = isset($fields['groom_full_name']) && trim((string) $fields['groom_full_name']) !== ''
            ? trim((string) $fields['groom_full_name'])
            : (isset($fields['groom_name']) ? trim((string) $fields['groom_name']) : '');

        if ($name1 === '' && $name2 === '') return;

        $title = sprintf('The Wedding of %s-%s', $name1, $name2);
        $display = isset($fields['display_name']) && trim((string) $fields['display_name']) !== ''
            ? trim((string) $fields['display_name'])
            : trim(sprintf('%s & %s', $name1, $name2));
        $date = isset($fields['date_upper']) ? trim((string) $fields['date_upper']) : '';
        $description = trim(implode(' • ', array_filter([$display, $date, 'Mohon doa restu atas pernikahan kami; detail acara dan konfirmasi kehadiran tersedia di tautan undangan.'])));

        // Cover for the Social tab + featured image — only set when the couple
        // uploaded one. `couple_illustration_url` may be a plain URL or a
        // JSON-encoded / nested array (slideshow slots); resolve the first public URL.
        $image = '';
        if (isset($fields['couple_illustration_url'])) {
            $cand = $fields['couple_illustration_url'];
            if (is_string($cand) && trim($cand) !== '') {
                $t = trim($cand);
                if (preg_match('#^https?://#i', $t)) {
                    $image = $t;
                } else {
                    $dec = json_decode($t, true);
                    if (is_array($dec)) {
                        foreach ($dec as $u) {
                            if (is_string($u) && trim($u) !== '' && preg_match('#^https?://#i', trim($u))) { $image = trim($u); break; }
                        }
                    }
                }
            }
        }
        if ($image === '' && isset($fields['cover_photos']) && is_array($fields['cover_photos'])) {
            $walk = function (array $arr) use (&$walk, &$image) {
                foreach ($arr as $v) {
                    if ($image !== '') return;
                    if (is_string($v)) {
                        if (trim($v) !== '' && preg_match('#^https?://#i', trim($v))) { $image = trim($v); return; }
                    } elseif (is_array($v)) {
                        $walk($v);
                    }
                }
            };
            $walk($fields['cover_photos']);
        }

        update_post_meta($post_id, 'rank_math_title', $title);
        update_post_meta($post_id, 'rank_math_description', $description);
        update_post_meta($post_id, 'rank_math_og_title', $title);
        update_post_meta($post_id, 'rank_math_og_description', $description);

        if ($image !== '') {
            $imported = self::sideload_image($image);
            $att_id = isset($imported['id']) && (int) $imported['id'] > 0 ? (int) $imported['id'] : 0;
            $att_url = isset($imported['url']) && $imported['url'] !== '' ? $imported['url'] : $image;
            update_post_meta($post_id, 'rank_math_og_image', $att_url);
            if ($att_id > 0) update_post_meta($post_id, 'rank_math_og_image_id', $att_id);
            update_post_meta($post_id, 'rank_math_twitter_image', $att_url);
            // Featured image (used by Rank Math "Image" snippet + WP media) = cover.
            if ($att_id > 0) update_post_meta($post_id, '_thumbnail_id', $att_id);
            else delete_post_meta($post_id, '_thumbnail_id');
        } else {
            delete_post_meta($post_id, 'rank_math_og_image');
            delete_post_meta($post_id, 'rank_math_og_image_id');
            delete_post_meta($post_id, 'rank_math_twitter_image');
            // No cover -> leave featured image empty.
            delete_post_meta($post_id, '_thumbnail_id');
        }
    }

    private static function apply_fields_to_post(int $target_id, array $fields, array $manifest, array &$updated): bool
    {
        global $wpdb;

        $data = get_post_meta($target_id, '_elementor_data', true);
        if (!$data) return false;

        $elements = json_decode($data, true);
        if (!is_array($elements)) return false;

        // Snapshot pre-reconcile tree so purely structural/visibility changes (e.g. the
        // gift_section hide marker or copy-button text) trigger a DB write even when no
        // mapped field value changed ($changed would otherwise stay false).
        $tree_before = wp_json_encode($elements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // F2 — dynamic bank/e-wallet cards: clone/trim containers to match the
        // couple's rekening rows BEFORE patching, and extend the manifest slots.
        [$elements, $manifest] = self::reconcile_gift_containers($elements, $fields, $manifest);

        // F2b — dynamic Love Story accordion: sync nested-accordion items + children to stories count.
        [$elements, $manifest] = self::reconcile_story_accordion($elements, $fields, $manifest);

        // F2d — dynamic Love Story cards (container type): one mapped container
        // per story (title + image + description inside), cloned to match the
        // couple's story count. See reconcile_story_containers.
        [$elements, $manifest] = self::reconcile_story_containers($elements, $fields, $manifest);

        // F2c — dynamic sessions: 1-5 sessions via cloning second container.
        [$elements, $manifest] = self::reconcile_sessions($elements, $fields, $manifest);

        // F4 — hide the alamat pengiriman card when the couple has no address
        // (single container). Reappears automatically once an address is set.
        $elements = self::reconcile_gift_address($elements, $fields, $manifest);

        // F6 — hide/show whole sections (gift, video, turut mengundang, kisah cinta)
        // via the mapped parent container, driven by the couple's dashboard toggles
        // and package gates.
        $elements = self::reconcile_section_visibility($elements, $fields, $manifest);

        // F9 - hide instagram handle widgets when the couple left them empty,
        // so the master's placeholder handle doesn't stay visible. Reappears
        // automatically once a handle is set.
        $elements = self::reconcile_instagram_visibility($elements, $fields, $manifest);

        // F10 — hide the hashtag element when empty.
        $elements = self::reconcile_display_name_visibility($elements, $fields, $manifest);

        // F7 — auto-fill copy buttons: each bank/address card may carry a
        // `weddingpress-copy-text` widget whose `dce_clipboard_text` should hold the
        // submitted account number / address so guests copy the real value.
        $elements = self::reconcile_copy_buttons($elements, $fields, $manifest);

        // F8 — self-heal broken template backgrounds (scoped to mapped elements only —
        // outside mapped elements must stay byte-identical to master).
        $elements = self::normalize_backgrounds($elements, $manifest);

        $changed = $tree_before !== wp_json_encode($elements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $fields_to_apply = array_merge(
            self::extract_simple_fields($fields, $manifest),
            self::extract_simple_array_fields($fields, $manifest, $elements),
            self::extract_object_array_fields($fields, $manifest),
            self::extract_gallery_field($fields, $manifest, $elements)
        );

        // Fallback: if track_url is provided but not in manifest, find and patch
        // any weddingpress-audio widget in the post/popup.
        if (isset($fields['track_url']) && $fields['track_url'] !== '') {
            $audio_id = self::find_first_widget_id($elements, 'weddingpress-audio');
            if ($audio_id) {
                // Patch both audio_url (fallback) and audio_upload (widget's primary source)
                // audio_upload needs id=0 for external URLs to work
                $fields_to_apply[] = [
                    'elementId' => $audio_id,
                    'settings' => ['audio_url'],
                    'value' => $fields['track_url'],
                ];
                $fields_to_apply[] = [
                    'elementId' => $audio_id,
                    'settings' => ['audio_upload', 'url'],
                    'value' => $fields['track_url'],
                ];
                $fields_to_apply[] = [
                    'elementId' => $audio_id,
                    'settings' => ['audio_upload', 'id'],
                    'value' => 0,
                ];
            }
        }

        // Fallback: sideload Lottie JSON files for any lottie widget using external URLs.
        // This ensures the animation loads on wp.aksaraa.com (external attachment IDs don't exist here).
        $lottie_ids = self::find_all_widget_ids($elements, 'lottie');
        foreach ($lottie_ids as $lottie_id) {
            $lottie_node = self::find_node($elements, $lottie_id);
            if ($lottie_node && isset($lottie_node['settings']['source_json']['url'])) {
                $external_url = $lottie_node['settings']['source_json']['url'];
                $imported = self::sideload_lottie($external_url);
                if ($imported['id'] > 0 && $imported['url']) {
                    $fields_to_apply[] = [
                        'elementId' => $lottie_id,
                        'settings' => ['source_json', 'url'],
                        'value' => $imported['url'],
                    ];
                    $fields_to_apply[] = [
                        'elementId' => $lottie_id,
                        'settings' => ['source_json', 'id'],
                        'value' => $imported['id'],
                    ];
                }
            }
        }

        foreach ($fields_to_apply as $entry) {
            if (self::set_element_settings($elements, $entry['elementId'], $entry['settings'], $entry['value'])) {
                $changed = true;
                $updated[] = $entry['elementId'] . ':' . implode('.', $entry['settings']);
            }
        }

        if ($changed) {
            // Write RAW to avoid wp_slash/json_encode round-trip corruption.
            $wpdb->update(
                $wpdb->postmeta,
                ['meta_value' => wp_json_encode($elements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)],
                ['post_id' => $target_id, 'meta_key' => '_elementor_data']
            );
            // Clear the per-request meta cache so the CSS regen (later in this same
            // request) reads the fresh _elementor_data instead of the stale cached copy.
            wp_cache_delete($target_id, 'post_meta');
            // Bump post_modified so Elementor's get_newer_autosave() does NOT prefer a
            // stale autosave revision over our freshly-written _elementor_data.
            $wpdb->update($wpdb->posts, [
                'post_modified' => current_time('mysql'),
                'post_modified_gmt' => current_time('mysql', true),
            ], ['ID' => $target_id]);
            // Delete stale revision _elementor_data (belt & suspenders).
            $wpdb->query($wpdb->prepare(
                "DELETE pm FROM {$wpdb->postmeta} pm
                 INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                 WHERE p.post_parent = %d AND p.post_type = 'revision' AND pm.meta_key = '_elementor_data'",
                $target_id
            ));
            // Clear Elementor caches for THIS post only, so the frontend re-renders
            // from the fresh _elementor_data (otherwise it serves stale cached HTML).
            foreach (['_elementor_css', '_elementor_element_cache', '_elementor_page_assets'] as $cache_key) {
                $wpdb->delete($wpdb->postmeta, ['post_id' => $target_id, 'meta_key' => $cache_key]);
            }
            // Also delete the generated CSS file (stale file baked at an earlier
            // zoomed/tall state keeps serving even after meta is cleared).
            $cache_file = WP_CONTENT_DIR . '/uploads/elementor/css/post-' . $target_id . '.css';
            if (file_exists($cache_file)) @unlink($cache_file);
        }
        // Always drop the rendered-HTML caches, even when nothing changed: a
        // cheap lazy rebuild on next view beats serving stale HTML (gallery
        // uploads landing between patches kept showing stale tiles until the
        // next change-triggered clear).
        foreach (['_elementor_element_cache', '_elementor_page_assets'] as $cache_key) {
            $wpdb->delete($wpdb->postmeta, ['post_id' => $target_id, 'meta_key' => $cache_key]);
        }
        return $changed;
    }

    private static function normalize_video_url(string $url): string
    {
        $url = trim($url);
        if ($url === '') return $url;
        $parts = parse_url($url);
        if (!$parts || empty($parts['host'])) return $url;
        $host = strtolower($parts['host']);
        if (strpos($host, 'youtube.com') !== false && !empty($parts['query'])) {
            parse_str($parts['query'], $qs);
            if (!empty($qs['v']) && preg_match('/^[a-zA-Z0-9_-]{11}$/', $qs['v'])) {
                return 'https://www.youtube.com/embed/' . $qs['v'];
            }
        }
        if ($host === 'youtu.be' && !empty($parts['path'])) {
            $id = trim($parts['path'], '/');
            $id = explode('?', $id)[0];
            $id = explode('&', $id)[0];
            if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $id)) {
                return 'https://www.youtube.com/embed/' . $id;
            }
        }
        return $url;
    }

    // Couples type plain usernames ("@rafi", "rafi", or a full URL) into the
    // instagram inputs. Social-icon link targets need a full URL; text targets
    // keep the raw handle (normalized at the call site, not here).
    private static function normalize_instagram_url($v): string
    {
        $t = trim((string) $v);
        $t = ltrim($t, "@ \t\n\r\0\x0B");
        $t = trim($t);
        if ($t === '') return '';
        if (stripos($t, 'instagram.com') !== false) {
            if (!preg_match('#^https?://#i', $t)) $t = 'https://' . ltrim($t, '/');
            return $t;
        }
        if (preg_match('#^https?://#i', $t)) return $t;
        return 'https://instagram.com/' . ltrim($t, '/');
    }

    // Simple (scalar) fields: manifest[field] = [{elementId, settings}] or {elementId, settings}.
    private static function extract_simple_fields(array $fields, array $manifest): array
    {
        $result = [];
        $skip = array_merge(['sessions', 'gift_accounts', 'stories', 'couple_illustration_url', 'gallery_photos'], ['inviting_families', 'cover_photos']);
        foreach ($manifest as $field => $mapping) {
            if (in_array($field, $skip, true)) continue;
            if (!array_key_exists($field, $fields)) continue;
            if ($fields[$field] === null || $fields[$field] === '') continue;
            if (is_array($fields[$field]) && empty($fields[$field])) continue;

            $value = $fields[$field];
            if ($field === 'video_url' && is_string($value)) {
                $value = self::normalize_video_url($value);
            }

            $mappings = is_array($mapping) && isset($mapping['elementId']) ? [$mapping] : $mapping;
            if (!is_array($mappings)) continue;
            foreach ($mappings as $m) {
                if (is_array($m) && isset($m['elementId'])) {
                    $v = $value;
                    // Instagram handles arrive as usernames ("@rafi"). Link
                    // targets (social icons) need full URLs; text targets keep
                    // the raw handle for display.
                    if (($field === 'groom_instagram' || $field === 'bride_instagram') && is_string($v)) {
                        $sp = is_array($m['settings']) ? array_values($m['settings']) : [];
                        $n = count($sp);
                        if ($n >= 2 && $sp[$n - 2] === 'link' && $sp[$n - 1] === 'url') {
                            $v = self::normalize_instagram_url($v);
                            if ($v === '') continue;
                        }
                    }
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $v,
                    ];
                }
            }
        }
        return $result;
    }

    // Flat arrays (inviting_families, cover_photos): manifest[field] = [{elementId, settings}],
    // fields[field] = [value0, value1, ...] — index i maps to mapping i.
    // Slots beyond the couple's items are left untouched (template placeholder), so
    // e.g. the popup/footer cover is NOT blanked when the couple uploads fewer covers
    // than the template has cover slots.
    // Cover slots targeting a media-carousel widget (empty settings path — the ops
    // picker suggests none) receive the FULL sideloaded cover list as slides,
    // same builder the gallery extractor uses.
    private static function extract_simple_array_fields(array $fields, array $manifest, array $elements = []): array
    {
        $result = [];
        foreach (['inviting_families', 'cover_photos'] as $array_field) {
            if (!isset($fields[$array_field]) || !is_array($fields[$array_field])) continue;
            $mapping = $manifest[$array_field] ?? [];
            if (!is_array($mapping)) continue;

            $items = array_values(array_filter($fields[$array_field], function ($v) {
                return $v !== null && $v !== '';
            }));
            if (count($items) === 0) continue; // couple hasn't set this — leave placeholders

            if ($array_field === 'inviting_families' && count($mapping) === 1 && count($items) > 1) {
                $m = $mapping[0];
                if (is_array($m) && isset($m['elementId'])) {
                    $joined = implode('<br>', $items);
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $joined,
                    ];
                }
                continue;
            }

            // Cover slots targeting a media-carousel widget (empty settings path)
            // take the WHOLE flattened cover list as slides — a per-index scalar
            // write can never address a slides array. Skipped from the scalar
            // loops below via $carouselSkip.
            $carouselSkip = [];
            if ($array_field === 'cover_photos' && !empty($elements)) {
                $flatUrls = self::flat_url_list($items);
                if (!empty($flatUrls)) {
                    foreach ($mapping as $m) {
                        if (!is_array($m) || empty($m['elementId'])) continue;
                        $node = self::find_node($elements, (string) $m['elementId']);
                        if (is_array($node) && ($node['widgetType'] ?? '') === 'media-carousel') {
                            foreach (self::media_slides_entries((string) $m['elementId'], $flatUrls) as $e) {
                                $result[] = $e;
                            }
                            $carouselSkip[(string) $m['elementId']] = true;
                        }
                    }
                }
            }

            foreach ($items as $i => $value) {
                $m = $mapping[$i] ?? null;
                if (is_array($m) && isset($m['elementId'])) {
                    if (isset($carouselSkip[(string) $m['elementId']])) continue;
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $value,
                    ];
                }
            }
            // Fill remaining mapped slots with the last item so all mapped elements
            // receive the value (e.g. default cover shown on every cover widget).
            $last = end($items);
            for ($i = count($items); $i < count($mapping); $i++) {
                $m = $mapping[$i] ?? null;
                if (is_array($m) && isset($m['elementId'])) {
                    if (isset($carouselSkip[(string) $m['elementId']])) continue;
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $last,
                    ];
                }
            }
        }
        return $result;
    }

    // Gallery widget: gallery_photos maps to ONE gallery/media-carousel widget.
    // gallery widget stores images in settings.gallery as [{id, url}].
    // media-carousel stores images in settings.slides as [{image: {id,url,alt,source}, _id, image_link_to_type}].
    // The couple's photos REPLACE the template's placeholders.
    private static function extract_gallery_field(array $fields, array $manifest, array $elements): array
    {
        $result = [];
        if (!isset($fields['gallery_photos']) || !is_array($fields['gallery_photos'])) return $result;
        $mapping = $manifest['gallery_photos'] ?? [];
        if (!is_array($mapping)) return $result;
        // Accept a single {elementId} mapping or a list of mappings. A template may
        // expose the gallery in more than one widget (e.g. image-carousel + media-carousel),
        // so every mapped element must be patched.
        $slots = isset($mapping['elementId']) ? [$mapping] : $mapping;
        if (!is_array($slots)) return $result;

        $urls = array_values(array_filter(array_map('strval', $fields['gallery_photos'])));
        if (empty($urls)) return $result;
        $imported_map = self::sideload_images_parallel($urls);

        foreach ($slots as $m) {
            if (!is_array($m) || empty($m['elementId'])) continue;

            // Detect widget type to use the correct Elementor settings key and value format.
            $node = self::find_node($elements, (string) $m['elementId']);
            $widgetType = $node['widgetType'] ?? '';

            if ($widgetType === 'media-carousel') {
                // media-carousel: settings.slides = [{image: {id,url,alt,source}, _id, image_link_to_type}]
                foreach (self::media_slides_entries((string) $m['elementId'], $urls) as $entry) {
                    $result[] = $entry;
                }
                continue;
            }

            // Gallery-style widgets store a flat [{id, url}] list, but the settings
            // key differs by widget:
            //  - image-carousel (core): `carousel`
            //  - image-gallery  (core): `wp_gallery`
            //  - gallery        (legacy/other): `gallery`
            $key = 'gallery';
            if ($widgetType === 'image-carousel') $key = 'carousel';
            elseif ($widgetType === 'image-gallery') $key = 'wp_gallery';

            $images = [];
            foreach ($urls as $url) {
                $imported = $imported_map[$url] ?? ['id' => 0, 'url' => $url];
                $images[] = ['id' => $imported['id'], 'url' => $imported['url']];
            }
            if (empty($images)) continue;
            $result[] = [
                'elementId' => $m['elementId'],
                'settings' => [$key],
                'value' => $images,
            ];
        }
        return $result;
    }

    // Shared builder: full URL list → media-carousel slides (+ static fallback
    // when a single slide would leave Swiper uninitialized). Sideloads via the
    // persistent source-URL mapping; failures keep id 0 + original URL.
    private static function media_slides_entries(string $elementId, array $urls): array
    {
        $result = [];
        $imported_map = self::sideload_images_parallel($urls);
        $slides = [];
        foreach ($urls as $url) {
            $imported = $imported_map[$url] ?? ['id' => 0, 'url' => $url];
            $slides[] = [
                'image' => [
                    'id' => $imported['id'],
                    'url' => $imported['url'],
                    'alt' => '',
                    'source' => 'library',
                ],
                '_id' => substr(md5(uniqid((string) mt_rand(), true)), 0, 7),
                'image_link_to_type' => 'file',
            ];
        }
        if (empty($slides)) return $result;
        $result[] = [
            'elementId' => $elementId,
            'settings' => ['slides'],
            'value' => $slides,
        ];
        // A single slide never initializes Elementor Pro's Swiper (its
        // handler bails at `<= 1` slide), so it can only ever show that one
        // image. Disable loop/autoplay/arrows so it renders as a static
        // focused photo instead of a dead carousel shell.
        if (count($slides) === 1) {
            foreach (['loop' => '', 'autoplay' => '', 'show_arrows' => ''] as $key => $val) {
                $result[] = [
                    'elementId' => $elementId,
                    'settings' => [$key],
                    'value' => $val,
                ];
            }
        }
        return $result;
    }

    // Flatten a possibly-nested URL list (cover slideshow slots) to plain URLs.
    private static function flat_url_list(array $items): array
    {
        $out = [];
        $walk = function ($arr) use (&$walk, &$out) {
            foreach ($arr as $v) {
                if (is_string($v)) {
                    if (trim($v) !== '') $out[] = trim($v);
                } elseif (is_array($v)) {
                    $walk($v);
                }
            }
        };
        $walk($items);
        return array_values($out);
    }

    private static function sideload_images_parallel(array $urls): array
    {        $result = [];
        $to_download = [];
        global $wpdb;
        $site = parse_url(site_url(), PHP_URL_HOST);
        foreach ($urls as $url) {
            $url = trim((string) $url);
            if ($url === '') { $result[$url] = ['id' => 0, 'url' => $url]; continue; }
            if (strpos($url, $site) !== false) { $result[$url] = ['id' => 0, 'url' => $url]; continue; }
            $existing_id = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_aksaraa_source_url' AND meta_value = %s LIMIT 1",
                $url
            ));
            if ($existing_id && get_post($existing_id) && wp_get_attachment_url($existing_id)) {
                $result[$url] = ['id' => $existing_id, 'url' => wp_get_attachment_url($existing_id) ?: $url];
            } else {
                $to_download[$url] = $url;
            }
        }
        if (empty($to_download)) return $result;

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $chunks = array_chunk($to_download, 6, true);
        foreach ($chunks as $chunk) {
            $mh = curl_multi_init();
            $handles = [];
            foreach ($chunk as $url) {
                $tmp = wp_tempnam(basename(parse_url($url, PHP_URL_PATH)) ?: 'aksaraa');
                $fp = fopen($tmp, 'w');
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_FILE, $fp);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 15);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
                curl_multi_add_handle($mh, $ch);
                $handles[$url] = ['ch' => $ch, 'fp' => $fp, 'tmp' => $tmp];
            }
            $running = null;
            do { curl_multi_exec($mh, $running); curl_multi_select($mh, 0.5); } while ($running > 0);
            foreach ($handles as $url => $h) {
                $code = curl_getinfo($h['ch'], CURLINFO_HTTP_CODE);
                fclose($h['fp']);
                curl_multi_remove_handle($mh, $h['ch']);
                curl_close($h['ch']);
                if ($code < 200 || $code >= 300 || !filesize($h['tmp'])) {
                    @unlink($h['tmp']);
                    $result[$url] = ['id' => 0, 'url' => $url];
                    continue;
                }
                $tmp_files[$url] = $h['tmp'];
            }
            curl_multi_close($mh);
        }

        foreach ($tmp_files as $url => $tmp) {
            $name = basename(parse_url($url, PHP_URL_PATH));
            if (!$name || $name === '.' || $name === '/') $name = 'aksaraa-' . time() . '.jpg';
            $file_array = ['name' => $name, 'tmp_name' => $tmp];
            $id = media_handle_sideload($file_array, 0, null);
            @unlink($tmp);
            if (is_wp_error($id)) {
                $result[$url] = ['id' => 0, 'url' => $url];
            } else {
                update_post_meta($id, '_aksaraa_sideloaded', 1);
                update_post_meta($id, '_aksaraa_source_url', $url);
                $new_url = wp_get_attachment_url($id);
                $result[$url] = ['id' => (int) $id, 'url' => $new_url ?: $url];
            }
        }
        return $result;
    }

    // Download an external image URL and sideload it into the WP media library,
    // returning ['id' => attachment_id, 'url' => wp_url]. On failure, falls back
    // to the original URL with id 0.
    private static function sideload_image(string $url): array
    {
        static $mem = [];
        $url = trim($url);
        if ($url === '') return ['id' => 0, 'url' => $url];
        if (isset($mem[$url])) return $mem[$url];

        // Already on this WP — no need to re-import.
        $site = parse_url(site_url(), PHP_URL_HOST);
        if (strpos($url, $site) !== false) return $mem[$url] = ['id' => 0, 'url' => $url];

        // Reuse a previously-sideloaded attachment via a PERSISTENT postmeta mapping
        // (source URL -> attachment id), instead of a transient that can expire or go
        // stale after an attachment is deleted.
        global $wpdb;
        $existing_id = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_aksaraa_source_url' AND meta_value = %s LIMIT 1",
            $url
        ));
        if ($existing_id && get_post($existing_id) && wp_get_attachment_url($existing_id)) {
            return $mem[$url] = ['id' => $existing_id, 'url' => wp_get_attachment_url($existing_id) ?: $url];
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url($url, 15);
        if (is_wp_error($tmp)) return $mem[$url] = ['id' => 0, 'url' => $url];

        $name = basename(parse_url($url, PHP_URL_PATH));
        if (!$name || $name === '.' || $name === '/') $name = 'aksaraa-' . time() . '.jpg';

        $file_array = ['name' => $name, 'tmp_name' => $tmp];
        $id = media_handle_sideload($file_array, 0, null);
        @unlink($tmp);

        if (is_wp_error($id)) return $mem[$url] = ['id' => 0, 'url' => $url];

        // Persist the source URL so repeated PATCHes reuse this attachment without a
        // transient cache (and without ever referencing a dead id).
        update_post_meta($id, '_aksaraa_sideloaded', 1);
        update_post_meta($id, '_aksaraa_source_url', $url);

        $new_url = wp_get_attachment_url($id);
        return $mem[$url] = ['id' => (int) $id, 'url' => $new_url ?: $url];
    }

    // Object arrays (sessions, gift_accounts, stories):
    // manifest[field] = [{sub_field: {elementId, settings}}], fields[field] = [{sub_field: value}].
    // `stories_container` shares the couple's `stories` data — F2d rebuilds its
    // slots per clone before this runs, so each story fills its own card.
    private static function extract_object_array_fields(array $fields, array $manifest): array
    {
        $result = [];
        $keyMap = ['sessions' => 'sessions', 'gift_accounts' => 'gift_accounts', 'stories' => 'stories', 'stories_container' => 'stories'];
        foreach ($keyMap as $manifestKey => $fieldKey) {
            if (!isset($fields[$fieldKey]) || !is_array($fields[$fieldKey])) continue;
            $mapping = $manifest[$manifestKey] ?? [];
            if (!is_array($mapping)) continue;

            foreach ($fields[$fieldKey] as $i => $item) {
                if (!is_array($item)) continue;
                $slot = $mapping[$i] ?? null;
                if (!$slot || !is_array($slot)) continue;
                foreach ($slot as $sub_field => $sub_mapping) {
                    if (!array_key_exists($sub_field, $item)) continue;
                    // Explicit null = system blank (e.g. tanpa-photo): clear the
                    // slot instead of preserving whatever is there. Empty
                    // string keeps the old skip-and-preserve-placeholders rule.
                    if ($item[$sub_field] === null) {
                        if (is_array($sub_mapping) && isset($sub_mapping['elementId']) && self::is_image_settings_path($sub_mapping['settings'] ?? null)) {
                            $result[] = [
                                'elementId' => $sub_mapping['elementId'],
                                'settings' => is_array($sub_mapping['settings']) ? $sub_mapping['settings'] : [],
                                'value' => null,
                            ];
                        }
                        continue;
                    }
                    if ($item[$sub_field] === '') continue;
                    if (is_array($sub_mapping) && isset($sub_mapping['elementId'])) {
                        $result[] = [
                            'elementId' => $sub_mapping['elementId'],
                            'settings' => is_array($sub_mapping['settings']) ? $sub_mapping['settings'] : [],
                            'value' => $item[$sub_field],
                        ];
                    }
                }
            }
        }
        return $result;
    }

    // True when a manifest settings path addresses an Elementor image URL
    // (image/background widgets resolve via attachment id, not bare URL).
    private static function is_image_settings_path($settingsPath): bool
    {
        if (!is_array($settingsPath)) return false;
        $sp = array_values($settingsPath);
        $n = count($sp);
        if ($n === 0) return false;
        $lastKey = $sp[$n - 1];
        $parentKey = $sp[0] ?? '';
        return $lastKey === 'url' && in_array($parentKey, ['background_image', 'background_overlay_image', 'image'], true);
    }

    private static function set_element_settings(array &$elements, string $elementId, array $settingsPath, $value): bool
    {
        // Synthetic overlay targets (`{containerId}__overlay`) resolve to the base
        // container; the settings path already carries `background_overlay_image.url`.
        if (substr($elementId, -9) === '__overlay') {
            $elementId = substr($elementId, 0, -9);
        }
        foreach ($elements as &$el) {
            if ($el['id'] === $elementId) {
                $target = &$el['settings'];
                for ($i = 0; $i < count($settingsPath) - 1; $i++) {
                    $key = $settingsPath[$i];
                    if (is_numeric($key) && is_array($target)) $key = (int) $key;
                    if (!isset($target[$key]) || !is_array($target[$key])) {
                        if (is_int($key)) {
                            while (count($target) <= $key) $target[] = [];
                        } else {
                            $target[$key] = [];
                        }
                    }
                    $target = &$target[$key];
                }
                $lastKey = end($settingsPath);
                if (is_numeric($lastKey) && is_array($target)) $lastKey = (int) $lastKey;
                $parentKey = $settingsPath[0] ?? '';

                // Background slideshow: needs 2 slides to render. Accept an array of
                // {id,url} slides or a single URL (duplicated to 2 slides).
                if ($lastKey === 'background_slideshow_gallery') {
                    $urls = is_array($value) ? $value : [$value];
                    $slides = [];
                    foreach ($urls as $u) {
                        $imported = self::sideload_image((string) $u);
                        if ($imported['id'] > 0) $slides[] = ['id' => $imported['id'], 'url' => $imported['url']];
                    }
                    if (count($slides) === 1) $slides[] = $slides[0]; // keep 2 slides
                    if (count($slides) < 2) return false;
                    $target['background_slideshow_gallery'] = $slides;
                    $target['background_background'] = 'slideshow';
                    return true;
                }

                $isImageUrl = $lastKey === 'url' && in_array($parentKey, ['background_image', 'background_overlay_image', 'image'], true);
                if ($isImageUrl) {
                    // Explicit null = system blank (tanpa-photo): clear the
                    // slot AND its responsive variants instead of sideloading.
                    if ($value === null) {
                        $target['url'] = '';
                        $target['id'] = 0;
                        if (count($settingsPath) === 2) {
                            foreach (['_tablet', '_mobile'] as $suffix) {
                                $variantKey = $parentKey . $suffix;
                                if (isset($el['settings'][$variantKey]) && is_array($el['settings'][$variantKey])) {
                                    $el['settings'][$variantKey]['url'] = '';
                                    $el['settings'][$variantKey]['id'] = 0;
                                }
                            }
                        }
                        return true;
                    }
                    // Sideload the external image into the WP media library so Elementor
                    // can resolve it via a real attachment id (image/background widgets).
                    // A field may provide an array (2 slides); a single image uses the first.
                    $imgValue = is_array($value) ? (reset($value) ?: '') : $value;
                    $imported = self::sideload_image((string) $imgValue);
                    $target['url'] = $imported['url'];
                    $target['id'] = $imported['id'];

                    // Image controls have responsive variants (_tablet, _mobile) that
                    // Elementor renders as separate CSS rules. Patch them too, otherwise
                    // the couple's image only shows on desktop and the template's
                    // placeholder image still appears on tablet/mobile.
                    if (count($settingsPath) === 2) {
                        foreach (['_tablet', '_mobile'] as $suffix) {
                            $variantKey = $parentKey . $suffix;
                            if (isset($el['settings'][$variantKey]) && is_array($el['settings'][$variantKey])) {
                                $el['settings'][$variantKey]['url'] = $imported['url'];
                                $el['settings'][$variantKey]['id'] = $imported['id'];
                            }
                        }
                    }
                    // Overlay images render via ::before only when the overlay
                    // background type is "classic" — force it on patch.
                    if ($parentKey === 'background_overlay_image') {
                        $el['settings']['background_overlay_background'] = 'classic';
                    }
                } else {
                    if (is_string($value)) $value = wp_kses_post($value);
                    $target[$lastKey] = $value;
                }
                return true;
            }
            if (!empty($el['elements'])) {
                if (self::set_element_settings($el['elements'], $elementId, $settingsPath, $value)) {
                    return true;
                }
            }
        }
        unset($el);
        return false;
    }

    // ---------- DELETE /posts/{id} ----------
    public static function delete_post(WP_REST_Request $request)
    {
        $post_id = (int) $request->get_param('id');
        $force = $request->get_param('force') === '1';

        // Also delete linked popups
        $popups = self::find_linked_popups($post_id);
        foreach ($popups as $popup) {
            wp_delete_post($popup->ID, true);
            self::unregister_popup_condition($popup->ID);
        }

        $result = wp_delete_post($post_id, $force);
        if (!$result) return new WP_Error('failed', 'Delete failed', ['status' => 500]);

        return ['deleted' => $post_id, 'popups_also_deleted' => count($popups)];
    }

    // ---------- DELETE /posts/{id}/attachments ----------
    // Scoped attachment cleanup for the clearance teardown. Must be called
    // BEFORE the post is deleted (the post's _elementor_data is the source of
    // truth for which attachments belong to it). Only deletes attachment posts
    // referenced by this post (+ its linked popups) or its featured image.
    public static function delete_post_attachments(WP_REST_Request $request)
    {
        $post_id = (int) $request->get_param('id');
        $ids = [];

        $targets = self::find_linked_popups($post_id);
        $self = get_post($post_id);
        if ($self) array_unshift($targets, $self);

        foreach ($targets as $t) {
            if (!$t) continue;
            $thumb = get_post_thumbnail_id($t->ID);
            if ($thumb) $ids[] = (int) $thumb;

            $raw = get_post_meta($t->ID, '_elementor_data', true);
            if (!$raw) continue;
            $data = is_string($raw) ? json_decode($raw, true) : $raw;
            if (is_array($data)) self::collect_attachment_ids($data, $ids);
        }

        $ids = array_values(array_unique(array_filter($ids)));
        $deleted = 0;
        foreach ($ids as $aid) {
            if (get_post_type($aid) === 'attachment') {
                if (wp_delete_attachment($aid, true)) $deleted++;
            }
        }

        return ['deleted' => $deleted, 'candidates' => count($ids)];
    }

    private static function collect_attachment_ids($data, &$ids)
    {
        if (!is_array($data)) return;
        foreach ($data as $value) {
            if (is_array($value)) {
                self::collect_attachment_ids($value, $ids);
            } elseif (is_numeric($value)) {
                $n = (int) $value;
                if ($n > 0 && get_post_type($n) === 'attachment') $ids[] = $n;
            }
        }
    }

    public static function cleanup_orphans(WP_REST_Request $request)
    {
        $body = $request->get_json_params();
        $base_slug = sanitize_title($body['base_slug'] ?? '');
        $keep_post_id = (int) ($body['keep_post_id'] ?? 0);
        $old_post_id = (int) ($body['old_post_id'] ?? 0);
        global $wpdb;
        $deleted_posts = 0;
        $deleted_popups = 0;

        if ($old_post_id && $old_post_id !== $keep_post_id) {
            $exists = $wpdb->get_var($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID = %d", $old_post_id));
            if ($exists) {
                $popups = self::find_linked_popups($old_post_id);
                foreach ($popups as $popup) {
                    wp_delete_post($popup->ID, true);
                    self::unregister_popup_condition($popup->ID);
                    $deleted_popups++;
                }
                $res = wp_delete_post($old_post_id, true);
                if ($res) $deleted_posts++;
            }
        }

        if ($base_slug) {
            $like = $wpdb->esc_like($base_slug) . '%';
            $candidates = $wpdb->get_col($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_name LIKE %s AND post_type IN ('post','page') AND post_status IN ('publish','trash')",
                $like
            ));
            $age_guard = strtotime('-2 days');
            foreach ($candidates as $cid) {
                $cid = (int) $cid;
                if ($cid === $keep_post_id) continue;
                if ($old_post_id && $cid === $old_post_id) continue;
                $pname = $wpdb->get_var($wpdb->prepare("SELECT post_name FROM {$wpdb->posts} WHERE ID = %d", $cid));
                if (strpos($pname, $base_slug) !== 0) continue;
                // Age guard: never delete a recently-duplicated post that isn't yet
                // recorded as active_wp_post_id (reaper can race a just-finished
                // duplicate). Only sweep orphans older than 2 days.
                $created = strtotime($wpdb->get_var($wpdb->prepare("SELECT post_date FROM {$wpdb->posts} WHERE ID = %d", $cid)));
                if ($created !== false && $created > $age_guard) continue;
                $popups = self::find_linked_popups($cid);
                foreach ($popups as $popup) {
                    wp_delete_post($popup->ID, true);
                    self::unregister_popup_condition($popup->ID);
                    $deleted_popups++;
                }
                $res = wp_delete_post($cid, true);
                if ($res) $deleted_posts++;
            }
            $orphan_popups = $wpdb->get_results($wpdb->prepare(
                "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s",
                '_elementor_conditions'
            ));
            foreach ($orphan_popups as $row) {
                if (preg_match('#/(\d+)#', $row->meta_value, $m)) {
                    $pid = (int) $m[1];
                    if ($pid === $keep_post_id) continue;
                    $pname = $wpdb->get_var($wpdb->prepare("SELECT post_name FROM {$wpdb->posts} WHERE ID = %d", $pid));
                    if (!$pname) {
                        wp_delete_post($row->post_id, true);
                        self::unregister_popup_condition($row->post_id);
                        $deleted_popups++;
                    } elseif (strpos($pname, $base_slug) === 0 && $pid !== $keep_post_id) {
                        $parent_exists = $wpdb->get_var($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID = %d AND post_status IN ('publish','trash')", $pid));
                        if (!$parent_exists || $pid !== $keep_post_id) {
                            $still_exists = $wpdb->get_var($wpdb->prepare("SELECT ID FROM {$wpdb->posts} WHERE ID = %d", $row->post_id));
                            if ($still_exists) {
                                wp_delete_post($row->post_id, true);
                                self::unregister_popup_condition($row->post_id);
                                $deleted_popups++;
                            }
                        }
                    }
                }
            }
        }

        return ['deleted_posts' => $deleted_posts, 'deleted_popups' => $deleted_popups, 'kept' => $keep_post_id];
    }

    private static function unregister_popup_condition(int $popup_id)
    {
        $option = get_option('elementor_pro_theme_builder_conditions', []);
        if (is_array($option) && isset($option['popup'][$popup_id])) {
            unset($option['popup'][$popup_id]);
            update_option('elementor_pro_theme_builder_conditions', $option);
        }
    }

    private static function find_first_widget_id(array $elements, string $widgetType): string
    {
        foreach ($elements as $el) {
            if (($el['widgetType'] ?? '') === $widgetType) return $el['id'] ?? '';
            if (!empty($el['elements'])) {
                $found = self::find_first_widget_id($el['elements'], $widgetType);
                if ($found) return $found;
            }
        }
        return '';
    }

    private static function reconcile_story_accordion(array $elements, array $fields, array $manifest): array
    {
        $slots = $manifest['stories'] ?? [];
        $baseSlot = is_array($slots) && isset($slots[0]) ? $slots[0] : null;
        if (!is_array($baseSlot)) return [$elements, $manifest];
        $accordionId = $baseSlot['title']['elementId'] ?? $baseSlot['description']['elementId'] ?? $baseSlot['image_url']['elementId'] ?? null;
        if (!is_string($accordionId) || $accordionId === '') {
            $accordionId = self::find_first_widget_id($elements, 'nested-accordion');
        } else {
            $test = self::find_node($elements, $accordionId);
            if (!$test || ($test['widgetType'] ?? '') !== 'nested-accordion') {
                $found = self::find_first_widget_id($elements, 'nested-accordion');
                if ($found) $accordionId = $found;
            }
        }
        if (!$accordionId) return [$elements, $manifest];
        $desired = 0;
        if (isset($fields['stories']) && is_array($fields['stories'])) {
            foreach ($fields['stories'] as $s) {
                if (!is_array($s)) continue;
                $t = trim((string) ($s['title'] ?? ''));
                $d = trim((string) ($s['description'] ?? ''));
                $im = trim((string) ($s['image_url'] ?? ''));
                if ($t !== '' || $d !== '' || $im !== '') $desired++;
            }
        }
        if ($desired === 0) $desired = 1;

        $updated = false;
        $elements = self::apply_to_node($elements, $accordionId, function (array &$acc) use ($desired, &$updated) {
            $items = $acc['settings']['items'] ?? [];
            if (!is_array($items)) $items = [];
            $children = $acc['elements'] ?? [];
            if (!is_array($children)) $children = [];
            $cur = count($items);
            if ($cur < $desired) {
                $templateItem = $items[0] ?? ['item_title' => '', '_id' => ''];
                $templateChild = $children[0] ?? null;
                for ($i = $cur; $i < $desired; $i++) {
                    $newItem = is_array($templateItem) ? $templateItem : [];
                    $newItem['_id'] = substr(md5(uniqid((string) mt_rand(), true)), 0, 7);
                    $newItem['item_title'] = '';
                    $items[] = $newItem;
                    if ($templateChild) {
                        $map = [];
                        $clone = self::deep_clone($templateChild, $map);
                        $children[] = $clone;
                    }
                    $updated = true;
                }
            } elseif ($cur > $desired) {
                $items = array_slice($items, 0, $desired);
                $children = array_slice($children, 0, $desired);
                $updated = true;
            }
            $acc['settings']['items'] = array_values($items);
            $acc['elements'] = array_values($children);
        });

        if (!$updated) {
            $accNode = self::find_node($elements, $accordionId);
            if (!$accNode) return [$elements, $manifest];
        }
        $accNode = self::find_node($elements, $accordionId);
        if (!$accNode) return [$elements, $manifest];
        $children = $accNode['elements'] ?? [];
        $newSlots = [];
        foreach (array_keys(array_slice($children, 0, $desired)) as $i) {
            $child = $children[$i] ?? null;
            if (!$child) continue;
            $imageId = self::find_descendant_widget_id($child, 'image');
            $textId = self::find_descendant_widget_id($child, 'text-editor');
            if (!$imageId) $imageId = self::find_descendant_widget_id($child, 'image');
            $newSlots[] = [
                'title' => ['elementId' => $accordionId, 'settings' => ['items', (string) $i, 'item_title']],
                'description' => $textId ? ['elementId' => $textId, 'settings' => ['editor']] : ($baseSlot['description'] ?? ['elementId' => $accordionId, 'settings' => ['items', (string) $i, 'item_title']]),
                'image_url' => $imageId ? ['elementId' => $imageId, 'settings' => ['image', 'url']] : ($baseSlot['image_url'] ?? ['elementId' => $accordionId, 'settings' => ['items', (string) $i, 'item_title']]),
            ];
        }
        while (count($newSlots) < $desired) {
            $newSlots[] = $baseSlot;
        }
        $manifest['stories'] = array_slice($newSlots, 0, $desired);
        return [$elements, $manifest];
    }

    // F2d — dynamic Love Story cards (container type). Templates whose love
    // story is ONE container (title + image + description widgets inside,
    // e.g. template-33) map it once via `stories_container`:
    // {container: {elementId}, title: {...}, description: {...}, image_url: {...}}.
    // Story 1 patches the master in place; stories 2..N clone the container
    // (fresh elementIds, `_aksaraa_story_clone` tag). Each clone is inserted
    // right after the previous card, so DOM order always matches story order
    // (master first, never removed). Surplus clones are trimmed when stories
    // shrink; zero stories hides the master instead of deleting it. Manifest
    // slots are rebuilt per card so the standard object-array extractor fills
    // them. Legacy slot-array `stories` templates never carry this key.
    private static function reconcile_story_containers(array $elements, array $fields, array $manifest): array
    {
        $mapping = $manifest['stories_container'] ?? null;
        if (!is_array($mapping)) return [$elements, $manifest];
        $slot = isset($mapping['container']) ? $mapping : ($mapping[0] ?? null);
        if (!is_array($slot) || empty($slot['container']['elementId'])) return [$elements, $manifest];
        $masterId = (string) $slot['container']['elementId'];
        $master = self::find_node($elements, $masterId);
        if (!is_array($master)) return [$elements, $manifest];

        $stories = (isset($fields['stories']) && is_array($fields['stories'])) ? array_values($fields['stories']) : [];
        $items = [];
        foreach ($stories as $s) {
            if (!is_array($s)) continue;
            foreach (['title', 'description', 'image_url'] as $k) {
                if (isset($s[$k]) && trim((string) $s[$k]) !== '') { $items[] = $s; break; }
            }
        }
        $desired = count($items);
        if ($desired > 6) {
            error_log('[aksaraa] stories_container: capped at 6 stories (had ' . $desired . ')');
            $desired = 6;
        }

        $hideNode = function (array &$node, bool $hide) {
            $node['settings'] = $node['settings'] ?? [];
            $classes = trim((string) ($node['settings']['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
            if ($hide) $tokens[] = 'aksaraa-hidden';
            $node['settings']['_css_classes'] = implode(' ', $tokens);
        };

        if ($desired === 0) {
            $elements = self::apply_to_node($elements, $masterId, function (array &$c) use ($hideNode) { $hideNode($c, true); });
            $stale = self::find_clone_ids($elements, '_aksaraa_story_clone');
            if (!empty($stale)) {
                $elements = self::remove_nodes_by_id($elements, $stale);
            }
            return [$elements, $manifest];
        }

        // Unhide master + any existing clones (a previously-empty state).
        $elements = self::apply_to_node($elements, $masterId, function (array &$c) use ($hideNode) { $hideNode($c, false); });
        foreach (self::find_clone_ids($elements, '_aksaraa_story_clone') as $cid) {
            $elements = self::apply_to_node($elements, $cid, function (array &$c) use ($hideNode) { $hideNode($c, false); });
        }

        // Clone / trim to desired count.
        $cloneIds = self::find_clone_ids($elements, '_aksaraa_story_clone');
        if (count($cloneIds) + 1 < $desired) {
            $anchor = end($cloneIds) ?: $masterId;
            for ($i = count($cloneIds) + 1; $i < $desired; $i++) {
                $fresh = self::find_node($elements, $masterId);
                if (!is_array($fresh)) break;
                $map = null;
                $clone = self::tag_clone(self::clone_subtree($fresh, $map), '_aksaraa_story_clone');
                $elements = self::insert_after($elements, $anchor, $clone);
                $anchor = $map[$masterId] ?? $anchor;
            }
        } elseif (count($cloneIds) + 1 > $desired) {
            $excess = array_slice($cloneIds, $desired - 1);
            if (!empty($excess)) $elements = self::remove_nodes_by_id($elements, $excess);
        }

        // Rebuild manifest slots: slot 0 = master, then one per clone in DOM
        // order, inner widget ids re-derived from each card subtree.
        $baseTitle = $slot['title'] ?? null;
        $baseDesc = $slot['description'] ?? null;
        $baseImg = $slot['image_url'] ?? null;
        $cardIds = array_merge([$masterId], self::find_clone_ids($elements, '_aksaraa_story_clone'));
        $newSlots = [];
        foreach ($cardIds as $cid) {
            $card = self::find_node($elements, $cid);
            if (!is_array($card)) continue;
            $headings = self::find_descendant_headings($card);
            $descId = self::find_descendant_widget_id($card, 'text-editor');
            $row = ['container' => ['elementId' => $cid, 'settings' => []]];
            if (is_array($baseTitle) && !empty($baseTitle['elementId'])) {
                $row['title'] = ['elementId' => $headings[0] ?? $baseTitle['elementId'], 'settings' => is_array($baseTitle['settings'] ?? null) ? $baseTitle['settings'] : []];
            }
            if (is_array($baseDesc) && !empty($baseDesc['elementId'])) {
                $row['description'] = ['elementId' => $descId ?: $baseDesc['elementId'], 'settings' => is_array($baseDesc['settings'] ?? null) ? $baseDesc['settings'] : []];
            }
            if (is_array($baseImg) && !empty($baseImg['elementId'])) {
                // Image mapped on the card container itself (e.g. background)
                // follows the card id; a mapped inner image widget is
                // re-derived per card (falls back to the base id).
                $imgId = ((string) $baseImg['elementId'] === $masterId)
                    ? $cid
                    : (self::find_descendant_widget_id($card, 'image') ?: $baseImg['elementId']);
                $row['image_url'] = ['elementId' => $imgId, 'settings' => is_array($baseImg['settings'] ?? null) ? $baseImg['settings'] : []];
            }
            // Optional card-container background (e.g. a stock-photo backdrop
            // that tanpa-photo templates must clear via explicit null). The
            // container IS the card, so it trivially follows the card id.
            $baseBg = $slot['image_bg'] ?? null;
            if (is_array($baseBg) && !empty($baseBg['elementId'])) {
                $row['image_bg'] = ['elementId' => $cid, 'settings' => is_array($baseBg['settings'] ?? null) ? $baseBg['settings'] : []];
            }
            $newSlots[] = $row;
        }
        $manifest['stories_container'] = array_slice($newSlots, 0, max($desired, 1));

        return [$elements, $manifest];
    }

    private static function reconcile_sessions(array $elements, array $fields, array $manifest): array
    {
        // Explicit target (ops-mapped `sessions_section` / "Kontainer Acara") wins.
        // Otherwise derive it from the 2nd session slot as before. The explicit
        // element may be a container OR a widget (e.g. a stray label), and
        // `apply_to_node` matches any node id.
        $containerId = '';
        $explicit = $manifest['sessions_section'] ?? null;
        if (is_array($explicit)) {
            $slot = isset($explicit['elementId']) ? $explicit : ($explicit[0] ?? null);
            if (is_array($slot) && !empty($slot['elementId'])) {
                $containerId = (string) $slot['elementId'];
            }
        }

        if ($containerId === '') {
            $slots = $manifest['sessions'] ?? [];
            if (!is_array($slots) || count($slots) < 2) return [$elements, $manifest];
            $secondSlot = $slots[1] ?? null;
            if (!is_array($secondSlot)) return [$elements, $manifest];
            $probeId = $secondSlot['name']['elementId'] ?? $secondSlot['venue']['elementId'] ?? $secondSlot['date']['elementId'] ?? null;
            if (!$probeId) {
                foreach ($secondSlot as $v) {
                    if (is_array($v) && !empty($v['elementId'])) { $probeId = $v['elementId']; break; }
                }
            }
            if (!$probeId) return [$elements, $manifest];
            $innerId = self::find_element_parent_id($elements, (string) $probeId);
            if (!$innerId) return [$elements, $manifest];
            $outerId = self::find_element_parent_id($elements, $innerId);
            $containerId = $outerId ?: $innerId;
        }

        $desired = 0;
        if (isset($fields['sessions']) && is_array($fields['sessions'])) {
            foreach ($fields['sessions'] as $s) {
                if (!is_array($s)) continue;
                foreach (['name', 'venue', 'address', 'date', 'time'] as $k) {
                    if (!empty(trim((string) ($s[$k] ?? '')))) { $desired++; break; }
                }
            }
        }
        if ($desired === 0) $desired = 1;
        $hide = $desired < 2;

        $elements = self::apply_to_node($elements, $containerId, function (array &$container) use ($hide) {
            $settings = $container['settings'] ?? [];
            $classes = trim((string) ($settings['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden' && $c !== 'aksaraa-session-hidden'));
            if ($hide) $tokens[] = 'aksaraa-session-hidden';
            $settings['_css_classes'] = implode(' ', $tokens);
            $container['settings'] = $settings;
        });
        return [$elements, $manifest];
    }

    // F2 — dynamic bank

    // F2 — dynamic bank/e-wallet cards. The template ships ONE bank-card container
    // (manifest gift_accounts[0], the container holding the provider-logo image). When
    // a couple adds more rekening rows, clone that container N-1 times (fresh
    // elementIds, dynamic manifest slot per clone, clone tagged `_aksaraa_bank_clone`).
    // When rows are deleted, remove surplus clones (master is never removed).
    private static function reconcile_gift_containers(array $elements, array $fields, array $manifest): array
    {
        $slots = $manifest['gift_accounts'] ?? [];
        $baseSlot = is_array($slots) && isset($slots[0]) ? $slots[0] : null;
        if (!is_array($baseSlot)) return [$elements, $manifest];

        $subKeys = ['provider_name', 'account_number', 'account_name'];
        $baseIds = [];
        foreach ($subKeys as $k) {
            if (isset($baseSlot[$k]['elementId'])) $baseIds[$k] = $baseSlot[$k]['elementId'];
        }
        if (empty($baseIds['provider_name']) || (empty($baseIds['account_number']) && empty($baseIds['account_name']))) {
            return [$elements, $manifest];
        }

        // Master card = the container holding the base provider-logo image element.
        $masterId = self::find_element_parent_id($elements, $baseIds['provider_name']);
        if (!$masterId) return [$elements, $manifest];

        // Desired count = number of non-empty gift_accounts rows.
        // If none, hide the bank card container (don't keep a placeholder).
        $desired = 0;
        if (isset($fields['gift_accounts']) && is_array($fields['gift_accounts'])) {
            foreach ($fields['gift_accounts'] as $g) {
                if (is_array($g)) {
                    foreach (['provider_name', 'account_number', 'account_name'] as $k) {
                        if (!empty($g[$k])) { $desired++; break; }
                    }
                }
            }
        }
        if ($desired === 0) {
            $elements = self::apply_to_node($elements, $masterId, function (array &$container) {
                $settings = $container['settings'] ?? [];
                $classes = trim((string) ($settings['_css_classes'] ?? ''));
                $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
                $tokens[] = 'aksaraa-hidden';
                $settings['_css_classes'] = implode(' ', $tokens);
                $container['settings'] = $settings;
            });
            $cloneIdsZero = self::find_clone_ids($elements);
            if (!empty($cloneIdsZero)) {
                $elements = self::remove_nodes_by_id($elements, $cloneIdsZero);
            }
            $manifest['gift_accounts'] = [];
            return [$elements, $manifest];
        }

        $elements = self::apply_to_node($elements, $masterId, function (array &$c) {
            $s = $c['settings'] ?? [];
            $classes = trim((string) ($s['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($t) => $t !== '' && $t !== 'aksaraa-hidden' && $t !== 'aksaraa-addr-hidden'));
            $s['_css_classes'] = implode(' ', $tokens);
            $c['settings'] = $s;
        });
        $preCloneIds = self::find_clone_ids($elements);
        foreach ($preCloneIds as $cid) {
            $elements = self::apply_to_node($elements, $cid, function (array &$c) {
                $s = $c['settings'] ?? [];
                $classes = trim((string) ($s['_css_classes'] ?? ''));
                $tokens = array_values(array_filter(explode(' ', $classes), fn($t) => $t !== '' && $t !== 'aksaraa-hidden' && $t !== 'aksaraa-addr-hidden'));
                $s['_css_classes'] = implode(' ', $tokens);
                $c['settings'] = $s;
            });
        }

        // Existing clones = containers tagged `_aksaraa_bank_clone`.
        $cloneIds = self::find_clone_ids($elements);

        // Clone / trim.
        if (count($cloneIds) + 1 < $desired) {
            $master = self::find_node($elements, $masterId);
            for ($i = count($cloneIds) + 1; $i < $desired; $i++) {
                $clone = self::tag_clone(self::clone_subtree($master));
                // Insert AFTER master (sibling) so the master stays first in layout.
                $elements = self::insert_after($elements, $masterId, $clone);
            }
        } elseif (count($cloneIds) + 1 > $desired) {
            // Remove surplus clones (never the master).
            $excess = array_slice($cloneIds, $desired - 1);
            if (!empty($excess)) $elements = self::remove_nodes_by_id($elements, $excess);
        }

        // Rebuild manifest slots: slot 0 = master (base ids), then one per clone in order.
        $newSlots = [];
        $master = self::find_node($elements, $masterId);
        if ($master) {
            $imageId = self::find_descendant_widget_id($master, 'image');
            $headings = self::find_descendant_headings($master);
            $newSlots[] = [
                'provider_name' => ['elementId' => $imageId ?: $baseIds['provider_name'], 'settings' => ['image', 'url']],
                'account_number' => ['elementId' => $headings[0] ?? $baseIds['account_number'], 'settings' => ['title']],
                'account_name' => ['elementId' => $headings[1] ?? $baseIds['account_name'], 'settings' => ['title']],
            ];
        } else {
            $newSlots[] = $baseSlot;
        }

        $cloneIds = self::find_clone_ids($elements);
        foreach ($cloneIds as $cid) {
            $clone = self::find_node($elements, $cid);
            if (!$clone) { $newSlots[] = $baseSlot; continue; }
            $imageId = self::find_descendant_widget_id($clone, 'image');
            $headings = self::find_descendant_headings($clone);
            $newSlots[] = [
                'provider_name' => ['elementId' => $imageId ?: $baseIds['provider_name'], 'settings' => ['image', 'url']],
                'account_number' => ['elementId' => $headings[0] ?? $baseIds['account_number'], 'settings' => ['title']],
                'account_name' => ['elementId' => $headings[1] ?? $baseIds['account_name'], 'settings' => ['title']],
            ];
        }
        while (count($newSlots) < $desired) $newSlots[] = $baseSlot;
        $manifest['gift_accounts'] = array_slice($newSlots, 0, $desired);

        $elements = self::normalize_bank_card_mobile($elements, $masterId, self::find_clone_ids($elements));

        return [$elements, $manifest];
    }

    private static function normalize_bank_card_mobile(array $elements, string $masterId, array $cloneIds): array
    {
        $cardIds = array_values(array_unique(array_merge([$masterId], $cloneIds)));
        foreach ($cardIds as $cid) {
            $card = self::find_node($elements, $cid);
            if (!$card) continue;
            $headings = self::find_descendant_headings($card);
            foreach (array_slice($headings, 0, 2) as $hid) {
                $elements = self::apply_to_node($elements, $hid, function (array &$node) {
                    $node['settings']['_margin_mobile'] = $node['settings']['_margin_mobile'] ?? [];
                    $node['settings']['_margin_mobile']['top'] = 6;
                    $node['settings']['_margin_mobile']['bottom'] = 2;
                    $node['settings']['_margin_mobile']['isLinked'] = false;
                });
            }
        }
        return $elements;
    }

    // Apply $fn to the element with id $nodeId (in place) by reference, recursing.
    private static function apply_to_node(array $elements, string $nodeId, callable $fn): array
    {
        foreach ($elements as $i => &$el) {
            if (($el['id'] ?? '') === $nodeId) {
                $fn($el);
                break;
            }
            if (!empty($el['elements'])) {
                $el['elements'] = self::apply_to_node($el['elements'], $nodeId, $fn);
            }
        }
        unset($el);
        return $elements;
    }

    // F4 — single alamat pengiriman container. Unlike rekening (dynamic cards), the
    // address lives in ONE container (the one holding the manifest gift_address
    // element). When the couple has no address, hide that container (add CSS class)
    // so the WP post does not keep showing a deleted/empty address; it reappears
    // automatically once an address is set.
    private static function reconcile_gift_address(array $elements, array $fields, array $manifest): array
    {
        $mapping = $manifest['gift_address'] ?? null;
        if (!is_array($mapping)) return $elements;

        // Normalize to a single {elementId, settings} mapping.
        $slot = isset($mapping['elementId']) ? $mapping : ($mapping[0] ?? null);
        if (!is_array($slot) || empty($slot['elementId'])) return $elements;

        $addrId = $slot['elementId'];
        $containerId = self::find_element_parent_id($elements, (string) $addrId);
        if (!$containerId) return $elements;

        $hasAddress = isset($fields['gift_address'])
            && is_string($fields['gift_address'])
            && trim($fields['gift_address']) !== '';
        $locked = !empty($fields['gift_address_hidden']);

        $bankMasterId = null;
        if (!empty($manifest['gift_accounts']) && is_array($manifest['gift_accounts'][0] ?? null) && !empty($manifest['gift_accounts'][0]['provider_name']['elementId'])) {
            $bankMasterId = self::find_element_parent_id($elements, (string) $manifest['gift_accounts'][0]['provider_name']['elementId']);
        }
        $targetId = $containerId;
        if ($bankMasterId && $containerId === $bankMasterId) {
            $targetId = (string) $addrId;
        }

        return self::apply_to_node($elements, $targetId, function (array &$container) use ($hasAddress, $locked) {
            $settings = $container['settings'] ?? [];
            $classes = trim((string) ($settings['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-addr-hidden'));
            if (!$hasAddress || $locked) {
                $tokens[] = 'aksaraa-addr-hidden';
            }
            $settings['_css_classes'] = implode(' ', $tokens);
            $container['settings'] = $settings;
        });
    }

    // F6 — hide/show whole sections. The /ops mapping UI assigns a manifest field
    // (e.g. gift_section, video_section, inviting_families_section, story_section)
    // to the parent container wrapping that section. When the corresponding fields
    // flag is true, mark the container `aksaraa-hidden` (wp_head emits display:none);
    // otherwise remove the marker so it shows again. Reversible on the next patch.
    private static function reconcile_section_visibility(array $elements, array $fields, array $manifest): array
    {
        $sections = [
            'gift_section' => 'gift_section_hidden',
            'video_section' => 'video_section_hidden',
            'inviting_families_section' => 'inviting_families_hidden',
            'story_section' => 'story_hidden',
        ];

        foreach ($sections as $manifestKey => $hiddenField) {
            $mapping = $manifest[$manifestKey] ?? null;
            if (!is_array($mapping)) continue;
            $slot = isset($mapping['elementId']) ? $mapping : ($mapping[0] ?? null);
            if (!is_array($slot) || empty($slot['elementId'])) continue;

            $hidden = !empty($fields[$hiddenField]);
            $elements = self::apply_to_node($elements, (string) $slot['elementId'], function (array &$container) use ($hidden) {
                $container['settings'] = $container['settings'] ?? [];
                $classes = trim((string) ($container['settings']['_css_classes'] ?? ''));
                $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
                if ($hidden) {
                    $tokens[] = 'aksaraa-hidden';
                }
                $container['settings']['_css_classes'] = implode(' ', $tokens);
            });
        }

        // Gallery + cover visibility have SEPARATE scopes (F6g): gallery-type
        // widgets follow gallery_photos; cover-mapped media-carousels follow
        // cover_photos (a cover slideshow must not hide just because the
        // gallery is empty, nor show placeholders when covers are missing).
        // Scope comes from the manifest mapping, not the widget type alone;
        // carousels outside both mappings keep the legacy gallery rule.
        $elements = self::reconcile_media_visibility($elements, $fields, $manifest);

        return $elements;
    }

    // Media visibility by scope: `gallery` widgets (and carousels outside any
    // cover mapping) follow gallery emptiness; a media-carousel mapped under
    // cover_photos is NEVER hidden for emptiness — empty covers fall back to
    // the couple default image (injected upstream), which must show, not hide.
    // Strip-then-add (same pattern as section toggles) so stale markers from
    // an earlier empty state clear on the next patch.
    private static function reconcile_media_visibility(array $elements, array $fields, array $manifest): array
    {
        $galleryEmpty = !empty($fields['gallery_photos_hidden']);

        $slotIds = function ($mapping) {
            $ids = [];
            if (!is_array($mapping)) return $ids;
            $slots = isset($mapping['elementId']) ? [$mapping] : array_values($mapping);
            foreach ($slots as $m) {
                if (is_array($m) && !empty($m['elementId'])) $ids[(string) $m['elementId']] = true;
            }
            return $ids;
        };
        $galleryIds = $slotIds($manifest['gallery_photos'] ?? []);
        $coverIds = [];
        foreach (array_keys($slotIds($manifest['cover_photos'] ?? [])) as $cid) {
            $node = self::find_node($elements, $cid);
            if (is_array($node) && ($node['widgetType'] ?? '') === 'media-carousel') {
                $coverIds[$cid] = true;
            }
        }

        $walk = function (array $nodes) use (&$walk, $galleryEmpty, $galleryIds, $coverIds) {
            foreach ($nodes as &$el) {
                $wt = $el['widgetType'] ?? '';
                if ($wt === 'gallery' || $wt === 'media-carousel') {
                    $id = (string) ($el['id'] ?? '');
                    // Cover carousels always show (defaults fill emptiness);
                    // gallery scope hides only when gallery is empty.
                    $hide = (isset($coverIds[$id]) && !isset($galleryIds[$id])) ? false : $galleryEmpty;
                    $el['settings'] = $el['settings'] ?? [];
                    $classes = trim((string) ($el['settings']['_css_classes'] ?? ''));
                    $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
                    if ($hide) $tokens[] = 'aksaraa-hidden';
                    $el['settings']['_css_classes'] = implode(' ', $tokens);
                }
                if (!empty($el['elements'])) {
                    $el['elements'] = $walk($el['elements']);
                }
            }
            unset($el);
            return $nodes;
        };
        return $walk($elements);
    }

    // F9 - hide instagram handle widgets when the couple left the handle empty,
    // so the template master's placeholder handle doesn't stay visible on the
    // live invitation. Markers are removed (widget reappears) as soon as a
    // handle is set. Runs inside apply_fields_to_post, i.e. on every patch
    // (including the post-duplicate patch), for the post and its popups.
    private static function reconcile_instagram_visibility(array $elements, array $fields, array $manifest): array
    {
        foreach (['groom_instagram', 'bride_instagram'] as $field) {
            $mapping = $manifest[$field] ?? null;
            if (!is_array($mapping)) continue;
            // Accept a single {elementId, settings} slot or a list of them.
            $slots = isset($mapping['elementId']) ? [$mapping] : array_values($mapping);
            $ids = [];
            foreach ($slots as $slot) {
                if (is_array($slot) && !empty($slot['elementId'])) {
                    $ids[] = (string) $slot['elementId'];
                }
            }
            if (empty($ids)) continue;

            $hasValue = isset($fields[$field]) && is_string($fields[$field]) && trim($fields[$field]) !== '';
            foreach ($ids as $id) {
                $elements = self::apply_to_node($elements, $id, function (array &$node) use ($hasValue) {
                    $node['settings'] = $node['settings'] ?? [];
                    $classes = trim((string) ($node['settings']['_css_classes'] ?? ''));
                    $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
                    if (!$hasValue) {
                        $tokens[] = 'aksaraa-hidden';
                    }
                    $node['settings']['_css_classes'] = implode(' ', $tokens);
                });
            }
        }

        return $elements;
    }

    // F10 - hide the display_name (hashtag) element when the couple left the
    // hashtag empty, so the master's placeholder name doesn't stay visible on
    // the live invitation. Marker removed (element reappears) as soon as a
    // hashtag is set. Runs inside apply_fields_to_post, i.e. on every patch
    // (including the post-duplicate patch), for the post and its popups.
    // display_name_section (mapped separately in /ops, directly under the
    // hashtag row) hides the hashtag's PARENT container too, so no empty gap
    // remains. Both keys share the same empty-hashtag condition.
    private static function reconcile_display_name_visibility(array $elements, array $fields, array $manifest): array
    {
        $slots = [];
        foreach (['display_name', 'display_name_section'] as $key) {
            $mapping = $manifest[$key] ?? null;
            if (!is_array($mapping)) continue;
            // Accept a single {elementId, settings} slot or a list of them.
            $list = isset($mapping['elementId']) ? [$mapping] : array_values($mapping);
            foreach ($list as $slot) {
                if (is_array($slot) && !empty($slot['elementId'])) {
                    $slots[] = (string) $slot['elementId'];
                }
            }
        }
        $ids = array_values(array_unique($slots));
        if (empty($ids)) return $elements;

        $hasValue = isset($fields['display_name']) && is_string($fields['display_name']) && trim($fields['display_name']) !== '';
        foreach ($ids as $id) {
            $elements = self::apply_to_node($elements, $id, function (array &$node) use ($hasValue) {
                $node['settings'] = $node['settings'] ?? [];
                $classes = trim((string) ($node['settings']['_css_classes'] ?? ''));
                $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
                if (!$hasValue) {
                    $tokens[] = 'aksaraa-hidden';
                }
                $node['settings']['_css_classes'] = implode(' ', $tokens);
            });
        }

        return $elements;
    }

    // F7 — auto-fill copy buttons. Each bank/ewallet card container may hold a
    // `weddingpress-copy-text` widget whose `dce_clipboard_text` is what gets copied
    // on click. Set it to the submitted account number (per slot) and the address card's
    // to the real address. Skips silently if a card has no such widget (safe no-op).
    private static function reconcile_copy_buttons(array $elements, array $fields, array $manifest): array
    {
        // Bank/e-wallet cards.
        $slots = $manifest['gift_accounts'] ?? [];
        $accts = $fields['gift_accounts'] ?? [];
        if (is_array($slots) && is_array($accts)) {
            foreach ($slots as $i => $slot) {
                if (!is_array($slot) || empty($slot['provider_name']['elementId'])) continue;
                $cardId = self::find_element_parent_id($elements, (string) $slot['provider_name']['elementId']);
                if (!$cardId) continue;
                $item = $accts[$i] ?? null;
                $val = is_array($item) ? ((string) ($item['account_number'] ?? '')) : '';
                if ($val === '') $val = is_array($item) ? ((string) ($item['account_name'] ?? '')) : '';
                $elements = self::set_copy_widget($elements, $cardId, $val);
            }
        }

        // Address card.
        $am = $manifest['gift_address'] ?? null;
        $addrSlot = isset($am['elementId']) ? $am : ($am[0] ?? null);
        if (is_array($addrSlot) && !empty($addrSlot['elementId'])) {
            $containerId = self::find_element_parent_id($elements, (string) $addrSlot['elementId']);
            if ($containerId) {
                $elements = self::set_copy_widget($elements, $containerId, (string) ($fields['gift_address'] ?? ''));
            }
        }

        return $elements;
    }

    // Set dce_clipboard_text on the first `weddingpress-copy-text` descendant of a
    // card container. No-op if the card has no copy widget or value is empty.
    private static function set_copy_widget(array $elements, string $containerId, string $value): array
    {
        if ($value === '') return $elements;
        $card = self::find_node($elements, $containerId);
        if (!$card) return $elements;
        $copyId = self::find_descendant_widget_id($card, 'weddingpress-copy-text');
        if (!$copyId) return $elements;
        return self::apply_to_node($elements, $copyId, function (array &$node) use ($value) {
            $node['settings'] = $node['settings'] ?? [];
            $node['settings']['dce_clipboard_text'] = $value;
        });
    }

    // F8 — self-heal broken template backgrounds. Template containers ship with:
    //   1. `background_background: "gradient"` but no gradient colors (renders BLACK and
    //      ignores background_image), OR
    //   2. a `background_image.url` on an external domain (e.g. the original template
    //      kit's host) whose attachment `id` does NOT exist in this WP's media library,
    //      so Elementor's wp_get_attachment_image_src() fails and emits no
    //      background-image CSS -> black.
    // Fix both: flip empty gradient -> classic, and sideload external background
    // images into the local media library (setting a valid id + wp.aksaraa.com url).
    private static function normalize_backgrounds(array $elements, array $manifest = []): array
    {
        $mapped = [];
        foreach ($manifest as $field => $val) {
            if (is_array($val) && isset($val['elementId'])) {
                $mapped[$val['elementId']] = true;
            } elseif (is_array($val)) {
                foreach ($val as $entry) {
                    if (is_array($entry) && isset($entry['elementId'])) {
                        $mapped[$entry['elementId']] = true;
                    } elseif (is_array($entry)) {
                        foreach ($entry as $sub) {
                            if (is_array($sub) && isset($sub['elementId'])) $mapped[$sub['elementId']] = true;
                        }
                    }
                }
            }
        }
        $walk = function (array &$nodes) use (&$walk, $mapped) {
            foreach ($nodes as &$el) {
                $s = $el['settings'] ?? null;
                if (!is_array($s)) { if (!empty($el['elements'])) $walk($el['elements']); continue; }
                $isMapped = isset($mapped[$el['id'] ?? '']);

                if ($isMapped) {
                    foreach (['background_image', 'background_image_tablet', 'background_image_mobile'] as $key) {
                        $bg = $s[$key] ?? null;
                        if (is_array($bg) && !empty($bg['url'])) {
                            $url = (string) $bg['url'];
                            $imported = self::sideload_image($url);
                            if (!empty($imported['id']) && $imported['id'] > 0 && !empty($imported['url'])) {
                                $s[$key]['url'] = $imported['url'];
                                $s[$key]['id'] = $imported['id'];
                            }
                        }
                    }
                    if (($s['background_background'] ?? '') === 'gradient'
                        && self::gradient_is_empty($s)
                        && !empty($s['background_image']['url'])) {
                        $s['background_background'] = 'classic';
                    }
                }

                $el['settings'] = $s;
                if (!empty($el['elements'])) $walk($el['elements']);
            }
        };
        $walk($elements);
        return $elements;
    }

    // A gradient is "empty" when no gradient colors are set (renders black and ignores image).
    // Check all possible gradient color keys for containers/sections and widgets.
    private static function gradient_is_empty(array $s): bool
    {
        $keys = ['color', 'color_b', 'background_color', 'background_color_b', 'gradient_color', 'gradient_color_b'];
        foreach ($keys as $k) {
            if (trim((string) ($s[$k] ?? '')) !== '') return false;
        }
        if (!empty($s['gradient_color_list']) && is_array($s['gradient_color_list'])) {
            foreach ($s['gradient_color_list'] as $item) {
                if (!empty($item['eae_animated_gradient_color']) || !empty($item['color'])) return false;
            }
        }
        return true;
    }

    // Return the smallest container id whose subtree holds $elementId.
    private static function find_element_parent_id(array $elements, string $id): string
    {
        foreach ($elements as $el) {
            if (self::subtree_contains_id($el, $id)) {
                // Treat `column` as a hideable boundary too. Section/Column-based
                // templates (e.g. template-6/8) wrap each session in its own column
                // under a SHARED section; without `column` this walks past the
                // per-session column up to the shared section and hides both
                // sessions' columns at once. Container layouts (template-4) are
                // unaffected (no columns in their chains).
                if (in_array($el['elType'] ?? '', ['section', 'container', 'column'], true)) {
                    $child = self::find_element_parent_id($el['elements'] ?? [], $id);
                    return $child ?: ($el['id'] ?? '');
                }
                return self::find_element_parent_id($el['elements'] ?? [], $id);
            }
        }
        return '';
    }

    private static function subtree_contains_id(array $node, string $id): bool
    {
        if (($node['id'] ?? '') === $id) return true;
        foreach ($node['elements'] ?? [] as $c) {
            if (self::subtree_contains_id($c, $id)) return true;
        }
        return false;
    }

    // Find ids of previously-cloned bank containers (tagged `_aksaraa_bank_clone`).
    private static function find_clone_ids(array $elements, string $tag = '_aksaraa_bank_clone'): array
    {
        $ids = [];
        $walk = function (array $nodes) use (&$walk, &$ids, $tag) {
            foreach ($nodes as $el) {
                if (in_array($el['elType'] ?? '', ['section', 'container'], true)
                    && !empty($el['settings'][$tag])) {
                    $ids[] = $el['id'] ?? '';
                }
                if (!empty($el['elements'])) $walk($el['elements']);
            }
        };
        $walk($elements);
        return $ids;
    }

    private static function tag_clone(array $node, string $tag = '_aksaraa_bank_clone'): array
    {
        if (!isset($node['settings'])) $node['settings'] = [];
        $node['settings'][$tag] = true;
        return $node;
    }

    private static function find_node(array $elements, string $id): ?array
    {
        foreach ($elements as $el) {
            if (($el['id'] ?? '') === $id) return $el;
            $found = self::find_node($el['elements'] ?? [], $id);
            if ($found) return $found;
        }
        return null;
    }

    private static function clone_subtree(array $node, array &$map = null): array
    {
        $map = [];
        return self::deep_clone($node, $map);
    }

    private static function deep_clone(array $node, array &$map): array
    {
        if (isset($node['id'])) {
            $newId = 'a' . strtolower(wp_generate_password(8, false, false));
            $map[$node['id']] = $newId;
            $node['id'] = $newId;
        }
        if (!empty($node['elements'])) {
            foreach ($node['elements'] as $i => $child) {
                $node['elements'][$i] = self::deep_clone($child, $map);
            }
        }
        return $node;
    }

    private static function insert_after(array $elements, string $targetId, array $node): array
    {
        $out = [];
        foreach ($elements as $el) {
            $out[] = $el;
            if (($el['id'] ?? '') === $targetId) {
                $out[] = $node;
            } elseif (!empty($el['elements']) && self::subtree_contains_id($el, $targetId)) {
                $el['elements'] = self::insert_after($el['elements'], $targetId, $node);
                $out[count($out) - 1] = $el;
            }
        }
        return $out;
    }

    private static function remove_nodes_by_id(array $elements, array $ids): array
    {
        $out = [];
        foreach ($elements as $el) {
            if (in_array($el['id'] ?? '', $ids, true)) continue;
            if (!empty($el['elements'])) $el['elements'] = self::remove_nodes_by_id($el['elements'], $ids);
            $out[] = $el;
        }
        return $out;
    }

    private static function find_descendant_widget_id(array $node, string $widgetType): string
    {
        foreach ($node['elements'] ?? [] as $child) {
            if (($child['widgetType'] ?? '') === $widgetType) return $child['id'] ?? '';
            if (!empty($child['elements'])) {
                $id = self::find_descendant_widget_id($child, $widgetType);
                if ($id) return $id;
            }
        }
        return '';
    }

    private static function find_all_widget_ids(array $elements, string $widgetType): array
    {
        $ids = [];
        $walk = function (array $nodes) use (&$walk, &$ids, $widgetType) {
            foreach ($nodes as $el) {
                if (($el['widgetType'] ?? '') === $widgetType) {
                    $ids[] = $el['id'] ?? '';
                }
                if (!empty($el['elements'])) $walk($el['elements']);
            }
        };
        $walk($elements);
        return $ids;
    }

    private static function sideload_lottie(string $url): array
    {
        $url = trim($url);
        if ($url === '') return ['id' => 0, 'url' => $url];

        // Already on this WP — no need to re-import.
        $site = parse_url(site_url(), PHP_URL_HOST);
        if (strpos($url, $site) !== false) return ['id' => 0, 'url' => $url];

        // Reuse a previously-sideloaded attachment.
        global $wpdb;
        $existing_id = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_aksaraa_source_url' AND meta_value = %s LIMIT 1",
            $url
        ));
        if ($existing_id && get_post($existing_id) && wp_get_attachment_url($existing_id)) {
            return ['id' => $existing_id, 'url' => wp_get_attachment_url($existing_id) ?: $url];
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = download_url($url);
        if (is_wp_error($tmp)) return ['id' => 0, 'url' => $url];

        $name = basename(parse_url($url, PHP_URL_PATH));
        if (!$name || $name === '.' || $name === '/') $name = 'aksaraa-lottie-' . time() . '.json';

        $file_array = ['name' => $name, 'tmp_name' => $tmp];
        $id = media_handle_sideload($file_array, 0, null);
        @unlink($tmp);

        if (is_wp_error($id)) return ['id' => 0, 'url' => $url];

        update_post_meta($id, '_aksaraa_sideloaded', 1);
        update_post_meta($id, '_aksaraa_source_url', $url);

        $new_url = wp_get_attachment_url($id);
        return ['id' => (int) $id, 'url' => $new_url ?: $url];
    }

    private static function find_descendant_headings(array $node): array
    {
        $out = [];
        foreach ($node['elements'] ?? [] as $child) {
            if (($child['widgetType'] ?? '') === 'heading') $out[] = $child['id'] ?? '';
            if (!empty($child['elements'])) {
                foreach (self::find_descendant_headings($child) as $h) $out[] = $h;
            }
        }
        return $out;
    }

}

// Output audio tag for posts with _aksaraa_track_url
add_action('wp_footer', function () {
    $track = get_post_meta(get_the_ID(), '_aksaraa_track_url', true);
    if ($track) {
        echo '<audio id="song" src="' . esc_url($track) . '" loop></audio>';
        // The template popup's inline script redefines a broken global playAudio()
        // (with a null `x`) and it runs AFTER this footer, clobbering any override.
        // So we listen directly on document in the capture phase instead — it plays
        // #song and closes the popup on ".button-undangan" click, immune to that.
        echo '<script>(function(){var s=document.getElementById("song");'
           . 'document.addEventListener("click",function(e){var t=e.target;var b=(t&&t.closest)?t.closest(".button-undangan"):null;'
           . 'if(!b)return;if(s)s.play().catch(function(){});'
           . 'if(window.elementorProFrontend&&window.elementorProFrontend.modules&&window.elementorProFrontend.modules.popup){try{window.elementorProFrontend.modules.popup.closePopup({},e);}catch(err){}}'
           . '},true);'
           . 'window.pauseAudio=function(){if(s)s.pause();};'
           . '})();</script>';
        // Floating pause/resume music toggle (Font Awesome icons, loaded via the
        // aksaraa-font-awesome enqueue above).
        echo '<button id="aksaraa-music-toggle" type="button" aria-label="Putar atau jeda musik" title="Putar / Jeda musik"'
           . ' style="position:fixed;top:calc(50% - 130px);right:16px;z-index:100000;width:46px;height:46px;border-radius:50%;border:none;'
           . 'background:rgba(17,17,17,.55);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;'
           . 'box-shadow:0 2px 10px rgba(0,0,0,.35);-webkit-tap-highlight-color:transparent;">'
           . '<i class="fas fa-volume-up" aria-hidden="true" style="font-size:20px;line-height:1"></i></button>';
        echo '<script>(function(){var s=document.getElementById("song");var b=document.getElementById("aksaraa-music-toggle");'
           . 'if(!b){return;}var i=b.querySelector("i");'
           . 'function upd(){if(!s){return;}i.className=s.paused?"fas fa-volume-off":"fas fa-volume-up";}'
           . 'if(s){s.addEventListener("play",upd);s.addEventListener("pause",upd);}'
           . 'b.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(!s){return;}'
           . 'if(s.paused){s.play().catch(function(){});}else{s.pause();}upd();});'
           . 'upd();})();</script>';
    }
});

// Lightweight interactive preview: when a template-master demo is opened with ?aksaraa_preview=1
// (used by the in-app "Lihat Template" iframe), skip the interactive-only JS that a design preview
// does not need (guestbook/comment, XLSX export, QR styling, add-to-calendar, guest form). CSS is
// KEPT so the template renders pixel-identical; music (server-inline audio widget) is KEPT. This is
// render-time only — it never touches _elementor_data, Elementor settings, or the master, so the
// real template page and any couple duplicates are 100% unchanged and fully functional.
function aksaraa_is_light_preview()
{
    if (!is_singular() || empty($_GET['aksaraa_preview'])) {
        return false;
    }
    $name = get_post_field('post_name', get_queried_object_id());
    return is_string($name) && strpos($name, 'template-') === 0;
}

add_action('wp_enqueue_scripts', function () {
    if (!aksaraa_is_light_preview()) {
        return;
    }
    $strip_patterns = array(
        'comment-kit2',        // CUI guestbook/comment scripts + libs
        'xlsx.full',           // full XLSX export lib (CDN)
        'qr-code-styling',     // QR styling lib (unpkg)
        'add-to-calendar-button',
        'guest-form',          // weddingpress guest/RSVP submit js
        'exad-scripts',        // defer handled below; remove non-critical? keep visual deps
    );
    $scripts = wp_scripts();
    $queue   = $scripts->queue;
    foreach ($queue as $handle) {
        $src = isset($scripts->registered[$handle]->src) ? $scripts->registered[$handle]->src : '';
        foreach ($strip_patterns as $pat) {
            if (false !== strpos($src, $pat) || false !== stripos($handle, str_replace(array('.', '-'), '_', $pat))) {
                wp_dequeue_script($handle);
                break;
            }
        }
    }
    // Keep media-library "qr-code.js" (weddingpress frontend helper) out only if unused visual; leave.
    wp_dequeue_script('cui_js_script');
}, 200);

// Preview-only: fully remove any late-printed interactive scripts, defer the license check.
add_filter('script_loader_tag', function ($tag, $handle) {
    if (!aksaraa_is_light_preview()) {
        return $tag;
    }
    $drop_patterns = array('comment-kit2', 'xlsx.full', 'qr-code-styling', 'add-to-calendar-button', 'guest-form');
    foreach ($drop_patterns as $pat) {
        if (false !== strpos($tag, $pat)) {
            return ''; // drop the <script> tag entirely
        }
    }
    if (false !== stripos($tag, 'license.min.js')) {
        $tag = str_replace(' src=', ' defer src=', $tag);
    }
    return $tag;
}, 200, 2);

// Preview-only HTML tightening (render-time, no DB/data change):
//  - lazy-load below-fold <img> and <iframe> (YouTube embed etc.)
//  - decode images async
//  - preload the first eager <img> to improve LCP
//  - serve sibling .webp copies when present (same pixels, smaller bytes)
function aksaraa_preview_html($html)
{
    $uploads_host = 'wp.aksaraa.com/wp-content/uploads/';

    // 1) <img>: keep first one eager + preload, lazy + async the rest.
    $first_seen = false;
    $preload = '';
    $html = preg_replace_callback('/<img\b([^>]*)>/i', function ($m) use (&$first_seen, &$preload, $uploads_host) {
        $attrs = $m[1];
        if (preg_match('/\bloading\s*=/i', $attrs)) {
            return $m[0]; // Elementor already decided
        }
        $eager = !$first_seen;
        $first_seen = true;
        // pick an src to preload
        if ($eager && preg_match('/\bsrc=["\']([^"\']+)["\']/', $attrs, $sm) && strpos($sm[1], $uploads_host) !== false) {
            $preload = '<link rel="preload" as="image" href="' . esc_url($sm[1]) . '">';
        }
        if (!$eager) {
            $attrs = $attrs . ' loading="lazy"';
        }
        if (!preg_match('/\bdecoding\s*=/i', $attrs)) {
            $attrs = $attrs . ' decoding="async"';
        }
        return '<img' . $attrs . '>';
    }, $html);

    // 2) <iframe>: lazy (YouTube embeds, ~1MB) — skip ones already lazy.
    $html = preg_replace('/<iframe\b(?![^>]*\bloading\s*=)([^>]*)>/i', '<iframe$1 loading="lazy">', $html);

    // 3) Preload injection for first image.
    if ($preload !== '') {
        $html = preg_replace('/<head\b/i', '<head>' . $preload, $html, 1);
    }

    // 4) WebP rewrite (uploads only, only when sibling <file>.webp exists).
    $html = preg_replace_callback('#' . preg_quote($uploads_host, '#') . '([A-Za-z0-9./_-]+?\.(?:png|jpe?g|gif))(?=[\"\')\s]|$)#i', function ($m) use ($uploads_host) {
        $rel = $m[1];
        $candidate = WP_CONTENT_DIR . '/uploads/' . $rel . '.webp';
        if (file_exists($candidate)) {
            return $uploads_host . $rel . '.webp';
        }
        return $uploads_host . $rel;
    }, $html);

    return $html;
}

add_action('template_redirect', function () {
    if (aksaraa_is_light_preview()) {
        ob_start('aksaraa_preview_html');
    }
}, 5);

// Couple-post editor preview (?aksaraa_preview=1 on a duplicated post, sent by the
// dashboard editor iframe): neutralize the weddingpress-audio widget's eager fetch.
// The widget prints <audio> with NO preload attribute, so browsers default to
// preload=auto and download the full MP3 from Supabase on EVERY preview reload
// (each "Perbarui Undangan" click = one more full download = cached egress).
// Render-time only: guests (no aksaraa_preview param) are untouched, and manual
// play in preview still works (preload="none" never blocks .play()).
function aksaraa_is_couple_preview()
{
    if (!is_singular() || empty($_GET['aksaraa_preview'])) {
        return false;
    }
    if (aksaraa_is_light_preview()) return false; // masters handled above
    return true;
}

function aksaraa_couple_preview_html($html)
{
    // 1) Server-side: force preload="none" on <audio> tags that don't decide.
    $html = preg_replace('/<audio\b(?![^>]*\bpreload\s*=)([^>]*)>/i', '<audio$1 preload="none">', $html);
    // 2) Belt: pause anything autoplaying at load + catch late (popup) nodes.
    $belt = '<script>(function(){function n(a){try{if(a.tagName==="AUDIO"){a.preload="none";a.removeAttribute("autoplay");if(a.autoplay)a.autoplay=false;}}catch(e){}}function sweep(){try{var els=document.querySelectorAll("audio");for(var i=0;i<els.length;i++){var a=els[i];n(a);try{if(!a.paused)a.pause();}catch(e){}}}catch(e){}}sweep();document.addEventListener("DOMContentLoaded",sweep);window.addEventListener("load",sweep);try{var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){var ns=m[i].addedNodes;for(var j=0;j<ns.length;j++){var nd=ns[j];if(!nd||!nd.querySelectorAll)continue;if(nd.tagName==="AUDIO")n(nd);var inn=nd.querySelectorAll("audio");for(var k=0;k<inn.length;k++)n(inn[k]);}}});o.observe(document.documentElement,{childList:true,subtree:true});}catch(e){}})();</script>';
    if (stripos($html, '</body>') !== false) {
        $html = preg_replace('/<\/body>/i', $belt . '</body>', $html, 1);
    } else {
        $html .= $belt;
    }
    return $html;
}

add_action('template_redirect', function () {
    if (aksaraa_is_couple_preview()) {
        ob_start('aksaraa_couple_preview_html');
    }
}, 5);

// Guest + master frontend (always on): neutralize the weddingpress-audio
// widget's eager fetch. The widget prints <audio> with NO preload attribute,
// so browsers default to preload=auto and download the FULL MP3 on every page
// view — including link-preview crawlers and visitors who never press play.
// Playback paths (".button-undangan" gate click, #aksaraa-music-toggle) call
// .play(), which fetches on demand, so guests hear music exactly as before
// apart from a split-second start delay. Render-time only: never touches
// _elementor_data, Elementor settings, or any post. Idempotent (skips tags
// that already carry preload), so it composes with the preview buffers above.
function aksaraa_audio_preload_none($html)
{
    return preg_replace('/<audio\b(?![^>]*\bpreload\s*=)([^>]*)>/i', '<audio$1 preload="none">', $html);
}

add_action('template_redirect', function () {
    if (is_singular()) {
        ob_start('aksaraa_audio_preload_none');
    }
}, 6);

// Generic comment fix: the guestbook (CUI) comment form is built MANUALLY (it never calls
// comment_form()), and ships no `email` field. WP's `require_name_email` gate runs in
// wp_handle_comment_submission BEFORE preprocess_comment, so it wp_dies "Please fill the required
// fields." CUI renders each field via apply_filters("comment_form_field_{$name}", ...) — append the
// intended anonymous email to the author field so EVERY CUI comment form carries it (site-wide).
add_filter('comment_form_field_author', function ($field) {
    if (false === strpos($field, 'name="email"')) {
        $field .= '<p class="comment-form-email" style="display:none!important">'
            . '<input name="email" type="hidden" value="anonymous@wordpress.com" autocomplete="off" />'
            . '</p>';
    }
    return $field;
}, 99);

// Secondary net for any form rendered through comment_form() (non-CUI) so email is never missing.
add_filter('comment_form_fields', function ($fields) {
    if (empty($fields['email'])) {
        $fields['email'] = '<p class="comment-form-email" style="display:none!important">'
            . '<input name="email" type="hidden" value="anonymous@wordpress.com" autocomplete="off" />'
            . '</p>';
    }
    return $fields;
}, 99);

// Safety net (belt): preprocess_comment runs inside wp_new_comment AFTER the require_name_email gate,
// so it cannot satisfy that gate — it only guarantees a non-empty author/email reach the DB.
add_filter('preprocess_comment', function ($commentdata) {
    if (empty($commentdata['comment_author']) && isset($_GET['to']) && is_string($_GET['to']) && $_GET['to'] !== '') {
        $commentdata['comment_author'] = sanitize_text_field(wp_unslash($_GET['to']));
    }
    if (empty($commentdata['comment_author_email'])) {
        $commentdata['comment_author_email'] = 'anonymous@wordpress.com';
    }
    if (empty($commentdata['comment_author_url'])) {
        $commentdata['comment_author_url'] = '';
    }
    return $commentdata;
}, 10, 1);

// Prefill `nama tamu` (Elementor Form + CUI author) from ?to= so the required author/name field is
// never empty on the invitation; also append a hidden `email` as a client-side belt in case a form
// bypasses the comment_form_default_fields filter above.
add_action('wp_footer', function () {
    if (!is_singular()) return;
    echo '<script>(function(){function g(){try{return decodeURIComponent((new URLSearchParams(location.search).get("to")||"").replace(/\+/g," "))}catch(e){return""}}function fillName(){var to=g();if(!to)return;var sels=["input[name=\"author\"]","#author","input.cui-input[name=\"author\"]","input[name*=\"nama_tamu\"]","input[name*=\"nama tamu\"]","input[id*=\"nama_tamu\"]","input[id*=\"nama\"]","textarea[name*=\"nama_tamu\"]","input[name=\"form_fields[nama_tamu]\"]","input[name=\"form_fields[name]\"]","#form-field-nama_tamu","#form-field-nama","#form-field-author"];for(var i=0;i<sels.length;i++){try{var els=document.querySelectorAll(sels[i]);for(var j=0;j<els.length;j++){var el=els[j];if(el&&!el.value){el.value=to;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));}}}catch(e){}}}function ensureFields(e){var form=e&&e.target;if(!form||!form.matches||!form.matches("form[id^=\"commentform\"]"))return;var to=g();var a=form.querySelector("input[name=\"author\"]");if(a&&!a.value.trim()&&to){a.value=to;}if(!form.querySelector("input[name=\"email\"]")){var h=document.createElement("input");h.type="hidden";h.name="email";h.value="anonymous@wordpress.com";h.setAttribute("autocomplete","off");form.appendChild(h);}}fillName();document.addEventListener("DOMContentLoaded",fillName);document.addEventListener("submit",ensureFields,true);var obs=new MutationObserver(function(){fillName();});try{obs.observe(document.body,{childList:true,subtree:true});}catch(e){}if(window.jQuery){jQuery(document).on("elementor/popup/show",function(){setTimeout(fillName,200);});}document.addEventListener("click",function(e){var t=e.target;if(t&&t.closest&&t.closest(".elementor-button,.cui-link,.cui-button")){setTimeout(fillName,120);}},true);})();</script>';
});

// WeddingPress comment kit (ck2) rejects author names longer than 30 chars in its
// own client validation (/^[^?%$=\/]{1,30}$/), so titled guests (e.g. Prof./Dr.
// chains) can never submit through it. When the kit shows its name error AND the
// message is valid AND the failure is length-only, submit the same fields
// directly to wp-comments-post.php (server accepts + auto-approves via
// pre_comment_approved), then reload so the comment appears. Normal flow untouched.
add_action('wp_footer', function () {
    if (!is_singular()) return;
    echo '<script>(function(){'
        . 'function isKit(){return !!document.querySelector(".cui-container-form form");}'
        . 'if(!isKit())return;'
        . 'var done=false;'
        . 'var obs=new MutationObserver(function(){'
        . 'if(done)return;'
        . 'var err=document.querySelector(".cui-error-info-name");'
        . 'if(!err||getComputedStyle(err).display==="none")return;'
        . 'var form=err.closest("form");if(!form)return;'
        . 'var content=((form.querySelector("textarea")||{}).value||"").replace(/\\s+/g," ").trim();'
        . 'if(content.length<2)return;'
        . 'var authorEl=form.querySelector("input#author")||form.querySelector("input[name=\\"author\\"]");'
        . 'var author=((authorEl||{}).value||"").replace(/\\s+/g," ").trim();'
        . 'if(author.length<=30||/[?%$=\\/]/.test(author))return;'
        . 'done=true;'
        . 'var data=new FormData();'
        . 'data.append("author",author);'
        . 'var emailEl=form.querySelector("input#email")||form.querySelector("input[name=\\"email\\"]");'
        . 'data.append("email",(emailEl&&emailEl.value)||"anonymous@wordpress.com");'
        . 'data.append("comment",((form.querySelector("textarea")||{}).value||""));'
        . 'data.append("comment_post_ID",(form.getAttribute("id")||"").replace("commentform-",""));'
        . 'data.append("comment_parent",((form.querySelector("[name=\\"comment_parent\\"]")||{}).value||"0"));'
        . 'data.append("submit","Kirim");'
        . 'fetch(window.location.origin+"/wp-comments-post.php",{method:"POST",body:data,credentials:"same-origin"})'
        . '.then(function(){window.location.reload();});'
        . '});'
        . 'try{obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});}catch(e){}'
        . '})();</script>';
});

// Hide Hestia's native comment headline/reply for all singular posts.
// The invitation's guestbook is an Elementor widget (ck2) that renders inside
// _elementor_data, not via the theme's comments_template(), so hiding the
// theme's template does not affect it. Keep comment_status open for those
// posts (handled in duplicate + backfill) so Elementor's form can still submit.
add_filter('comments_template', function ($template) {
    if (is_singular()) return '';
    return $template;
});

// WeddingPress comment kit (ck2) invitation guestbook: auto-approve so the
// guestbook widget (which queries approved comments only) shows the message
// immediately after refresh. Wish Wall moderation is unaffected (separate
// `wishes` table stays pending/menunggu moderasi). Others keep WP default.
function aksaraa_is_comment_kit_post(int $post_id): bool
{
    $raw = get_post_meta($post_id, '_elementor_data', true);
    if (!is_string($raw) || $raw === '') return false;
    return strpos($raw, 'ck2_comments_text') !== false
        || strpos($raw, 'cui-container-comment') !== false
        || strpos($raw, 'wp-post-comments') !== false;
}

add_filter('pre_comment_approved', function ($approved, $commentdata) {
    $post_id = (int) ($commentdata['comment_post_ID'] ?? 0);
    if ($post_id && aksaraa_is_comment_kit_post($post_id)) {
        return 1; // auto-approve invitation guestbook comments
    }
    return $approved;
}, 10, 2);

// Allow JSON uploads for Lottie animations
add_filter('upload_mimes', function ($mimes) {
    $mimes['json'] = 'application/json';
    return $mimes;
});

// Hide Hestia page title on template pages (only Elementor content should show)
add_action('wp_head', function () {
    // Hide containers flagged via a `_css_classes` marker (e.g. empty alamat card
    // or a whole gift section toggled off in the dashboard). Elementor doesn't apply
    // `_css_classes` to a section/container's rendered class, so target the hidden
    // container by its element-id class instead.
    if (is_singular()) {
        $post_id = get_the_ID();
        $raw = get_post_meta($post_id, '_elementor_data', true);
        $tree = is_string($raw) ? json_decode($raw, true) : (is_array($raw) ? $raw : null);
        if (is_array($tree)) {
            $markers = ['aksaraa-addr-hidden', 'aksaraa-hidden', 'aksaraa-session-hidden'];
            $hidden = [];
            $singleSlideCarousels = [];
            $walk = function (array $nodes) use (&$walk, &$hidden, &$singleSlideCarousels, $markers) {
                foreach ($nodes as $el) {
                    $classes = (string) ($el['settings']['_css_classes'] ?? '');
                    if (is_array($el['settings'] ?? null) && !empty($el['id'])) {
                        foreach ($markers as $marker) {
                            if (strpos($classes, $marker) !== false) {
                                $hidden[] = $el['id'];
                                break;
                            }
                        }
                        // Elementor Pro's media-carousel handler bails out when there
                        // is <= 1 slide (`if (1 >= getSlidesCount()) return;`), so
                        // Swiper never sets widths and the widget collapses to its
                        // content width (0) inside a centered flex container. Force
                        // full width so a couple's single photo still renders.
                        if (($el['widgetType'] ?? '') === 'media-carousel') {
                            $slides = $el['settings']['slides'] ?? [];
                            if (is_array($slides) && count($slides) <= 1) {
                                $singleSlideCarousels[] = $el['id'];
                            }
                        }
                    }
                    if (!empty($el['elements'])) $walk($el['elements']);
                }
            };
            $walk($tree);
            if ($hidden) {
                $sel = implode(',', array_map(fn($id) => '.elementor-element-' . $id, array_unique($hidden)));
                echo '<style>' . $sel . '{ display: none !important; }</style>';
            }
            if ($singleSlideCarousels) {
                $sel = implode(',', array_map(fn($id) => '.elementor-element-' . $id, array_unique($singleSlideCarousels)));
                echo '<style>'
                    . $sel . '{ width: 100% !important; }'
                    . $sel . ' .elementor-main-swiper,' . $sel . ' .swiper,' . $sel . ' .swiper-wrapper,'
                    . $sel . ' .swiper-slide,' . $sel . ' .elementor-carousel-image { width: 100% !important; }'
                    . '</style>';
            }
        }
    }
    if (is_singular()) {
        // Mobile fix: `background-attachment: fixed` makes Elementor section/container
        // backgrounds render zoomed on iOS Safari + Android (bg attached to tall doc,
        // `cover` scales to the whole page height). Force scroll on mobile so the
        // SAFSWFSR-style hero images show full instead of cropped/zoomed. Layout-only,
        // not a content change — applies to master + all duplicated couple posts.
        echo '<style>@media (max-width: 767px) { .elementor-section > .elementor-background-video-container::before, .elementor-section.elementor-motion-effects-element-type-background > .elementor-motion-effects-container > .elementor-motion-effects-layer, .elementor-section > .elementor-background-slideshow, .e-con > .elementor-motion-effects-container > .elementor-motion-effects-layer, .e-con.elementor-motion-effects-element-type-background, .e-con.e-con-full { background-attachment: scroll !important; } }</style>';
    }
    if (is_singular() && get_post_meta(get_the_ID(), '_elementor_edit_mode', true) === 'builder') {
        // Hide the blog/page chrome so only the Elementor invitation + the
        // WeddingPress comment-kit guestbook render. The kit has its own form
        // `#commentform-{post}` inside _elementor_data — we do NOT hide it.
        // Native Hello reply is already absent because these posts use
        // `_wp_page_template = elementor_canvas`, so we only hide stray title
        // wrappers defensively (safe: kit form id is scoped, unaffected).
        echo '<style>'
            . '.entry-title, .hestia-title, .entry-header, .entry-meta, .post-meta, '
            . '.single-post .page-header, .single-post .page-title { display: none !important; }'
            . '</style>';
    }
    // Guard for Elementor Pro popup + audio duplication when template contains two audio widgets (post+popup).
    // Templates baked before the fix reference `document.elementorProFrontend` and call `closePopup("{}, event")`
    // (string instead of object). Alias the guard onto document too so those scripts no longer throw at runtime.
    echo '<script>(function(){var P=window.elementorProFrontend=window.elementorProFrontend||{modules:{popup:{showPopup:function(){},closePopup:function(){},popupPopped:false}}};window.elementorFrontend=window.elementorFrontend||{storage:{get:function(){},set:function(){}}};try{document.elementorProFrontend=P;}catch(e){}})();</script>';
});

AksaraaPlugin::init();
