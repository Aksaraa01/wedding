<?php
/**
 * Plugin Name: Aksaraa Wedding Integration
 * Description: REST API bridge for Aksaraa wedding template management
 * Version: 1.0.0
 * Author: Aksaraa
 */

defined('ABSPATH') || exit;

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
                    if (is_array($bg) && !empty($bg['url'])) {
                        $node['_preview'] = 'bg: ' . self::image_name($bg);
                    } elseif (is_array($slides) && !empty($slides)) {
                        $first = is_array($slides[0]) ? $slides[0] : [];
                        if (!empty($first['url'])) {
                            $names = [];
                            foreach ($slides as $s) {
                                if (is_array($s) && !empty($s['url'])) $names[] = self::image_name($s);
                            }
                            // Label slideshows with their slide count so the mapper knows
                            // this element expects 2 photos (a/b).
                            $node['_preview'] = 'slideshow (' . count($names) . '): ' . implode(' + ', array_slice($names, 0, 2));
                        }
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

    private static function apply_fields_to_post(int $target_id, array $fields, array $manifest, array &$updated)
    {
        global $wpdb;

        $data = get_post_meta($target_id, '_elementor_data', true);
        if (!$data) return;

        $elements = json_decode($data, true);
        if (!is_array($elements)) return;

        $changed = false;
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
}

// Output audio tag for posts with _aksaraa_track_url
add_action('wp_footer', function () {
    $track = get_post_meta(get_the_ID(), '_aksaraa_track_url', true);
    if ($track) {
        echo '<audio id="song" src="' . esc_url($track) . '" loop></audio>';
        // The popup's "Buka Undangan" button calls playAudio()/pauseAudio() with a
        // stale `x` captured before this footer tag existed. Redefine them to resolve
        // #song at call time so the music actually starts on click.
        echo '<script>window.playAudio=function(){var s=document.getElementById("song");if(s)s.play().catch(function(){});};'
           . 'window.pauseAudio=function(){var s=document.getElementById("song");if(s)s.pause();};</script>';
    }
});

// Allow JSON uploads for Lottie animations
add_filter('upload_mimes', function ($mimes) {
    $mimes['json'] = 'application/json';
    return $mimes;
});

// Hide Hestia page title on template pages (only Elementor content should show)
add_action('wp_head', function () {
    if (is_singular() && get_post_meta(get_the_ID(), '_wp_page_template', true) === 'default') {
        echo '<style>.hestia-title { display: none !important; }</style>';
    }
});

AksaraaPlugin::init();
