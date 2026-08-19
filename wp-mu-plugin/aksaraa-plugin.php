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
        return $request->get_header('X-Aksaraa-Secret') === self::SECRET;
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
            if (isset($el['settings'])) {
                $node['settings_keys'] = array_keys($el['settings']);
                $widgetType = $el['widgetType'] ?? '';
                $node['_preview'] = self::preview_text($widgetType, $el['settings']);
                // For containers/sections without widgetType, show background image.
                if ($node['_preview'] === '' && $widgetType === '') {
                    $bg = $el['settings']['background_image'] ?? [];
                    $slides = $el['settings']['background_slideshow_gallery'] ?? [];
                    $bgType = $el['settings']['background_background'] ?? '';
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
                    } elseif (is_array($bg) && !empty($bg['url'])) {
                        $node['_preview'] = 'bg: ' . self::image_name($bg);
                    }
                    if ($node['_preview'] !== '') {
                        // Append the first heading text so the mapper can tell which
                        // section this container is (e.g. bride vs groom vs ceremony).
                        $heading = self::first_heading_text($el['elements'] ?? []);
                        if ($heading !== '') $node['_preview'] .= ' · ' . $heading;
                    }
                }
            }
            if (!empty($el['elements'])) {
                $node['children'] = self::simplify_elements($el['elements']);
            }
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

        if (empty($results)) {
            $results = $wpdb->get_results($wpdb->prepare(
                "SELECT p.ID, p.post_title FROM {$wpdb->posts} p
                 INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = %s
                 WHERE p.post_type = %s AND p.post_status = %s
                 AND pm.meta_value LIKE %s",
                '_elementor_conditions', 'elementor_library', 'publish',
                '%include/general%'
            ));
        }

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
        $base_slug = sanitize_title($body['new_slug'] ?? '');

        // Generate a numbered slug like {base}-01, {base}-02, ...
        $new_slug = self::next_numbered_slug($base_slug ?: $slug);

        // Duplicate the post
        $new_id = wp_insert_post([
            'post_title' => $new_title,
            'post_name' => $new_slug,
            'post_content' => $master->post_content,
            'post_type' => $master->post_type,
            'post_status' => 'publish',
            'post_author' => get_current_user_id() ?: 1,
        ]);

        if (is_wp_error($new_id)) return $new_id;

        // Copy all post meta
        self::copy_post_meta($master->ID, $new_id);

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
        }

        // Register the new popup in the theme-builder conditions cache so it
        // renders on the new post. Direct option update is more reliable than
        // Conditions_Cache::regenerate() (which depends on a warmed document cache).
        foreach ($popup_map as $old_popup_id => $new_popup_id) {
            self::register_popup_condition($new_popup_id, $master->post_type, $new_id);
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

    private static function next_numbered_slug(string $base): string
    {
        global $wpdb;
        $existing = $wpdb->get_col($wpdb->prepare(
            "SELECT post_name FROM {$wpdb->posts} WHERE post_name = %s OR post_name LIKE %s",
            $base,
            $wpdb->esc_like($base) . '-%'
        ));

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

        // PATCH the post's _elementor_data
        self::apply_fields_to_post($post_id, $fields, $manifest, $updated);

        // Also patch linked popups
        $popups = self::find_linked_popups($post_id);
        foreach ($popups as $popup) {
            self::apply_fields_to_post($popup->ID, $fields, $manifest, $updated);
        }

        // Regenerate CSS for the patched post + popups (explicit, safe — no
        // clear_cache() which would break the conditions cache).
        self::regen_elementor_css($post_id);
        foreach ($popups as $popup) {
            self::regen_elementor_css($popup->ID);
        }

        // NOTE: sideloaded media is intentionally NOT garbage-collected here. An
        // automatic "delete orphaned attachments" step proved to delete still-
        // referenced images (covers, slideshow slides) and cause broken layouts.
        // Unused media accumulates harmlessly; manual cleanup can be added later
        // as an explicit /ops action with a long grace period.

        return ['patched' => $updated];
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

    private static function apply_fields_to_post(int $target_id, array $fields, array $manifest, array &$updated)
    {
        global $wpdb;

        $data = get_post_meta($target_id, '_elementor_data', true);
        if (!$data) return;

        $elements = json_decode($data, true);
        if (!is_array($elements)) return;

        // Snapshot pre-reconcile tree so purely structural/visibility changes (e.g. the
        // gift_section hide marker or copy-button text) trigger a DB write even when no
        // mapped field value changed ($changed would otherwise stay false).
        $tree_before = wp_json_encode($elements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // F2 — dynamic bank/e-wallet cards: clone/trim containers to match the
        // couple's rekening rows BEFORE patching, and extend the manifest slots.
        [$elements, $manifest] = self::reconcile_gift_containers($elements, $fields, $manifest);

        // F4 — hide the alamat pengiriman card when the couple has no address
        // (single container). Reappears automatically once an address is set.
        $elements = self::reconcile_gift_address($elements, $fields, $manifest);

        // F6 — hide/show the whole gift (Hadiah/Amplop) section via the mapped
        // parent container, driven by the couple's dashboard toggle.
        $elements = self::reconcile_gift_section($elements, $fields, $manifest);

        // F7 — auto-fill copy buttons: each bank/address card may carry a
        // `weddingpress-copy-text` widget whose `dce_clipboard_text` should hold the
        // submitted account number / address so guests copy the real value.
        $elements = self::reconcile_copy_buttons($elements, $fields, $manifest);

        $changed = $tree_before !== wp_json_encode($elements, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $fields_to_apply = array_merge(
            self::extract_simple_fields($fields, $manifest),
            self::extract_simple_array_fields($fields, $manifest),
            self::extract_object_array_fields($fields, $manifest),
            self::extract_gallery_field($fields, $manifest)
        );

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
        }
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

            $mappings = is_array($mapping) && isset($mapping['elementId']) ? [$mapping] : $mapping;
            if (!is_array($mappings)) continue;
            foreach ($mappings as $m) {
                if (is_array($m) && isset($m['elementId'])) {
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $fields[$field],
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
    private static function extract_simple_array_fields(array $fields, array $manifest): array
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

            foreach ($items as $i => $value) {
                $m = $mapping[$i] ?? null;
                if (is_array($m) && isset($m['elementId'])) {
                    $result[] = [
                        'elementId' => $m['elementId'],
                        'settings' => is_array($m['settings']) ? $m['settings'] : [],
                        'value' => $value,
                    ];
                }
            }
        }
        return $result;
    }

    // Gallery widget: gallery_photos maps to ONE gallery widget whose settings.gallery
    // is an array of {id, url}. The couple's photos REPLACE the template's placeholders.
    private static function extract_gallery_field(array $fields, array $manifest): array
    {
        $result = [];
        if (!isset($fields['gallery_photos']) || !is_array($fields['gallery_photos'])) return $result;
        $mapping = $manifest['gallery_photos'] ?? [];
        // Accept single mapping or array-of-mappings (take the first).
        $m = is_array($mapping) && isset($mapping['elementId']) ? $mapping : (is_array($mapping) && isset($mapping[0]) ? $mapping[0] : null);
        if (!$m || !is_array($m) || !isset($m['elementId'])) return $result;

        $images = [];
        foreach ($fields['gallery_photos'] as $url) {
            if ($url) {
                $imported = self::sideload_image((string) $url);
                $images[] = ['id' => $imported['id'], 'url' => $imported['url']];
            }
        }
        if (empty($images)) return $result;

        // The gallery widget always targets settings.gallery (an array of {id,url}),
        // regardless of what settings path was saved in the manifest.
        $result[] = [
            'elementId' => $m['elementId'],
            'settings' => ['gallery'],
            'value' => $images,
        ];
        return $result;
    }

    // Download an external image URL and sideload it into the WP media library,
    // returning ['id' => attachment_id, 'url' => wp_url]. On failure, falls back
    // to the original URL with id 0.
    private static function sideload_image(string $url): array
    {
        $url = trim($url);
        if ($url === '') return ['id' => 0, 'url' => $url];

        // Already on this WP — no need to re-import.
        $site = parse_url(site_url(), PHP_URL_HOST);
        if (strpos($url, $site) !== false) return ['id' => 0, 'url' => $url];

        // Reuse a previously-sideloaded attachment via a PERSISTENT postmeta mapping
        // (source URL -> attachment id), instead of a transient that can expire or go
        // stale after an attachment is deleted.
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
        if (!$name || $name === '.' || $name === '/') $name = 'aksaraa-' . time() . '.jpg';

        $file_array = ['name' => $name, 'tmp_name' => $tmp];
        $id = media_handle_sideload($file_array, 0, null);
        @unlink($tmp);

        if (is_wp_error($id)) return ['id' => 0, 'url' => $url];

        // Persist the source URL so repeated PATCHes reuse this attachment without a
        // transient cache (and without ever referencing a dead id).
        update_post_meta($id, '_aksaraa_sideloaded', 1);
        update_post_meta($id, '_aksaraa_source_url', $url);

        $new_url = wp_get_attachment_url($id);
        return ['id' => (int) $id, 'url' => $new_url ?: $url];
    }

    // Object arrays (sessions, gift_accounts, stories):
    // manifest[field] = [{sub_field: {elementId, settings}}], fields[field] = [{sub_field: value}].
    private static function extract_object_array_fields(array $fields, array $manifest): array
    {
        $result = [];
        foreach (['sessions', 'gift_accounts', 'stories'] as $array_field) {
            if (!isset($fields[$array_field]) || !is_array($fields[$array_field])) continue;
            $mapping = $manifest[$array_field] ?? [];
            if (!is_array($mapping)) continue;

            foreach ($fields[$array_field] as $i => $item) {
                if (!is_array($item)) continue;
                $slot = $mapping[$i] ?? null;
                if (!$slot || !is_array($slot)) continue;
                foreach ($slot as $sub_field => $sub_mapping) {
                    if (!isset($item[$sub_field])) continue;
                    if ($item[$sub_field] === null || $item[$sub_field] === '') continue;
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

    private static function set_element_settings(array &$elements, string $elementId, array $settingsPath, $value): bool
    {
        foreach ($elements as &$el) {
            if ($el['id'] === $elementId) {
                $target = &$el['settings'];
                for ($i = 0; $i < count($settingsPath) - 1; $i++) {
                    $key = $settingsPath[$i];
                    if (!isset($target[$key])) $target[$key] = [];
                    $target = &$target[$key];
                }
                $lastKey = end($settingsPath);
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

                $isImageUrl = $lastKey === 'url' && ($parentKey === 'background_image' || $parentKey === 'image');
                if ($isImageUrl) {
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
                } else {
                    // Non-image values (e.g. button link.url, heading title, editor html)
                    // are written verbatim — never sideloaded.
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

    private static function unregister_popup_condition(int $popup_id)
    {
        $option = get_option('elementor_pro_theme_builder_conditions', []);
        if (is_array($option) && isset($option['popup'][$popup_id])) {
            unset($option['popup'][$popup_id]);
            update_option('elementor_pro_theme_builder_conditions', $option);
        }
    }

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

        // Desired count = number of non-empty gift_accounts rows (min 1 = master card).
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
        if ($desired === 0) $desired = 1;

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

        // F5 — normalize the bank card's mobile layout on the master card AND every
        // clone (clones inherit the master's settings verbatim): scale the logo down
        // and clear the negative mobile margins that cause the account text to
        // overlap the logo on small screens.
        $elements = self::normalize_bank_card_mobile($elements, $masterId, self::find_clone_ids($elements));

        return [$elements, $manifest];
    }

    // F5 — fix mobile layout on bank/e-wallet cards: bound the logo width so it
    // scales on mobile, and zero the negative mobile margins that make the account
    // number/name overlap the logo. Applied to the master card + all clones.
    private static function normalize_bank_card_mobile(array $elements, string $masterId, array $cloneIds): array
    {
        $cardIds = array_values(array_unique(array_merge([$masterId], $cloneIds)));
        foreach ($cardIds as $cid) {
            $card = self::find_node($elements, $cid);
            if (!$card) continue;

            $imageId = self::find_descendant_widget_id($card, 'image');
            $headings = self::find_descendant_headings($card);

            // Bound the logo width on mobile so it scales down instead of overflowing.
            if ($imageId) {
                $elements = self::apply_to_node($elements, $imageId, function (array &$node) {
                    $node['settings'] = $node['settings'] ?? [];
                    // Leave desktop size alone; only cap the mobile width.
                    $node['settings']['width_mobile'] = ['size' => 80, 'unit' => 'px'];
                    // Clear the negative bottom margin that pulls text over the logo.
                    if (isset($node['settings']['_margin_mobile']['bottom'])
                        && $node['settings']['_margin_mobile']['bottom'] < 0) {
                        $node['settings']['_margin_mobile']['bottom'] = 0;
                    }
                });
            }

            // Clear negative top margins on the account number/name headings.
            foreach (array_slice($headings, 0, 2) as $hid) {
                $elements = self::apply_to_node($elements, $hid, function (array &$node) {
                    if (isset($node['settings']['_margin_mobile']['top'])
                        && $node['settings']['_margin_mobile']['top'] < 0) {
                        $node['settings']['_margin_mobile']['top'] = 0;
                    }
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

        return self::apply_to_node($elements, $containerId, function (array &$container) use ($hasAddress) {
            $settings = $container['settings'] ?? [];
            $classes = trim((string) ($settings['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-addr-hidden'));
            if (!$hasAddress) {
                $tokens[] = 'aksaraa-addr-hidden';
            }
            $settings['_css_classes'] = implode(' ', $tokens);
            $container['settings'] = $settings;
        });
    }

    // F6 — hide/show the whole gift (Hadiah/Amplop) section. The /ops mapping UI
    // assigns `gift_section` to the parent container wrapping the rekening + alamat
    // cards. When the couple's "gift_section_hidden" field is true, mark that
    // container `aksaraa-hidden` (the wp_head hook emits display:none); otherwise
    // remove the marker so it shows again. Reversible on the next patch.
    private static function reconcile_gift_section(array $elements, array $fields, array $manifest): array
    {
        $mapping = $manifest['gift_section'] ?? null;
        if (!is_array($mapping)) return $elements;
        $slot = isset($mapping['elementId']) ? $mapping : ($mapping[0] ?? null);
        if (!is_array($slot) || empty($slot['elementId'])) return $elements;

        $hidden = !empty($fields['gift_section_hidden']);
        return self::apply_to_node($elements, (string) $slot['elementId'], function (array &$container) use ($hidden) {
            $container['settings'] = $container['settings'] ?? [];
            $classes = trim((string) ($container['settings']['_css_classes'] ?? ''));
            $tokens = array_values(array_filter(explode(' ', $classes), fn($c) => $c !== '' && $c !== 'aksaraa-hidden'));
            if ($hidden) {
                $tokens[] = 'aksaraa-hidden';
            }
            $container['settings']['_css_classes'] = implode(' ', $tokens);
        });
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

    // Return the smallest container id whose subtree holds $elementId.
    private static function find_element_parent_id(array $elements, string $id): string
    {
        foreach ($elements as $el) {
            if (self::subtree_contains_id($el, $id)) {
                if (in_array($el['elType'] ?? '', ['section', 'container'], true)) {
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
    private static function find_clone_ids(array $elements): array
    {
        $ids = [];
        $walk = function (array $nodes) use (&$walk, &$ids) {
            foreach ($nodes as $el) {
                if (in_array($el['elType'] ?? '', ['section', 'container'], true)
                    && !empty($el['settings']['_aksaraa_bank_clone'])) {
                    $ids[] = $el['id'] ?? '';
                }
                if (!empty($el['elements'])) $walk($el['elements']);
            }
        };
        $walk($elements);
        return $ids;
    }

    private static function tag_clone(array $node): array
    {
        if (!isset($node['settings'])) $node['settings'] = [];
        $node['settings']['_aksaraa_bank_clone'] = true;
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

    private static function clone_subtree(array $node): array
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
            $hidden = [];
            $markers = ['aksaraa-addr-hidden', 'aksaraa-hidden'];
            $walk = function (array $nodes) use (&$walk, &$hidden, $markers) {
                foreach ($nodes as $el) {
                    $classes = (string) ($el['settings']['_css_classes'] ?? '');
                    if (is_array($el['settings'] ?? null) && !empty($el['id'])) {
                        foreach ($markers as $marker) {
                            if (strpos($classes, $marker) !== false) {
                                $hidden[] = $el['id'];
                                break;
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
        }
    }
    if (is_singular() && get_post_meta(get_the_ID(), '_wp_page_template', true) === 'default') {
        echo '<style>.hestia-title { display: none !important; }</style>';
    }
});

AksaraaPlugin::init();
