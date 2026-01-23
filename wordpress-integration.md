# WordPress Integration Guide

This guide explains how to integrate the Employee Booking Platform into your WordPress site.

## Prerequisites

1. WordPress installation (version 5.0 or higher)
2. Access to your WordPress theme files or ability to create a plugin
3. The built React application

## Method 1: Simple Iframe Embed (Easiest)

### Steps:

1. **Build the React app:**
```bash
cd client
npm run build
```

2. **Upload build folder:**
   - Upload the entire `build` folder to your WordPress server
   - Place it in: `wp-content/uploads/booking-app/` or your theme directory

3. **Add to WordPress page:**
   - Create a new page or edit an existing one
   - Switch to HTML/Code editor
   - Add this code:

```html
<div style="width: 100%; height: 800px;">
  <iframe 
    src="/wp-content/uploads/booking-app/index.html" 
    width="100%" 
    height="100%" 
    frameborder="0"
    style="border: none;">
  </iframe>
</div>
```

4. **Update API URL:**
   - Edit `client/src/services/api.js` before building
   - Change `API_BASE_URL` to your backend API URL
   - Or set `REACT_APP_API_URL` environment variable

## Method 2: WordPress Shortcode Plugin

### Create a Custom Plugin:

1. **Create plugin file:** `wp-content/plugins/booking-platform/booking-platform.php`

```php
<?php
/**
 * Plugin Name: Employee Booking Platform
 * Description: Integrate the booking platform into WordPress
 * Version: 1.0.0
 * Author: Your Name
 */

function booking_platform_enqueue_scripts() {
    // Enqueue React app scripts
    wp_enqueue_script(
        'booking-platform-app',
        plugin_dir_url(__FILE__) . 'build/static/js/main.js',
        array(),
        '1.0.0',
        true
    );
    
    wp_enqueue_style(
        'booking-platform-style',
        plugin_dir_url(__FILE__) . 'build/static/css/main.css',
        array(),
        '1.0.0'
    );
}
add_action('wp_enqueue_scripts', 'booking_platform_enqueue_scripts');

function booking_platform_shortcode($atts) {
    $api_url = isset($atts['api_url']) ? $atts['api_url'] : 'http://localhost:5000/api';
    
    return '
    <div id="booking-platform-root"></div>
    <script>
        window.BOOKING_API_URL = "' . esc_js($api_url) . '";
    </script>
    ';
}
add_shortcode('booking_platform', 'booking_platform_shortcode');
```

2. **Copy build files:**
   - Copy the entire `build` folder to `wp-content/plugins/booking-platform/build/`

3. **Activate plugin:**
   - Go to WordPress Admin → Plugins
   - Activate "Employee Booking Platform"

4. **Use shortcode:**
   - Add `[booking_platform api_url="https://your-api-url.com/api"]` to any page or post

## Method 3: Theme Integration

### Add to Theme:

1. **Copy build files:**
   - Copy `build` folder to your theme directory: `wp-content/themes/your-theme/booking-app/`

2. **Add to functions.php:**
```php
function enqueue_booking_app() {
    if (is_page('booking')) { // Replace 'booking' with your page slug
        wp_enqueue_script(
            'booking-app',
            get_template_directory_uri() . '/booking-app/static/js/main.js',
            array(),
            '1.0.0',
            true
        );
        wp_enqueue_style(
            'booking-app-style',
            get_template_directory_uri() . '/booking-app/static/css/main.css',
            array(),
            '1.0.0'
        );
    }
}
add_action('wp_enqueue_scripts', 'enqueue_booking_app');
```

3. **Create page template:** `page-booking.php`
```php
<?php
/**
 * Template Name: Booking Platform
 */
get_header();
?>

<div id="root"></div>

<?php
get_footer();
```

## Method 4: REST API Integration (Advanced)

If you want to integrate WordPress user authentication:

1. **Modify backend to accept WordPress JWT:**
   - Install WordPress JWT plugin
   - Modify `server/middleware/auth.js` to verify WordPress tokens

2. **Single Sign-On:**
   - Pass WordPress user session to React app
   - Use WordPress REST API for user data

## Configuration

### Backend API URL

Update the API URL in your React app before building:

**Option 1: Environment Variable**
```bash
REACT_APP_API_URL=https://your-api-domain.com/api npm run build
```

**Option 2: Edit `client/src/services/api.js`**
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### CORS Configuration

Make sure your backend allows requests from your WordPress domain:

In `server/index.js`, update CORS:
```javascript
app.use(cors({
  origin: ['http://your-wordpress-site.com', 'https://your-wordpress-site.com'],
  credentials: true
}));
```

## Security Considerations

1. **HTTPS:** Always use HTTPS in production
2. **API Security:** Protect your API endpoints
3. **CORS:** Configure CORS properly
4. **JWT Secret:** Use a strong, unique JWT secret
5. **Environment Variables:** Never commit `.env` files

## Troubleshooting

### Iframe not loading:
- Check file paths
- Verify build files are uploaded correctly
- Check browser console for errors

### API calls failing:
- Verify CORS settings
- Check API URL is correct
- Ensure backend is accessible from WordPress domain

### Styling issues:
- Check CSS file paths
- Verify all static assets are loaded
- Clear browser cache

## Support

For integration help, refer to:
- WordPress Codex: https://codex.wordpress.org/
- React Documentation: https://react.dev/
- Express.js Documentation: https://expressjs.com/
