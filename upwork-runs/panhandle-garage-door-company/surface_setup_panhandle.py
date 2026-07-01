# Surface setup script -- panhandle-garage-door-company
# ASCII-only. Creates docker-compose.yml, panhandle-theme, and docker network.
# Run via: python scripts/surface_run.py --lang python --file <this file>
import os
import sys
import pathlib

WORKSPACE = pathlib.Path("panhandle_wp")
THEME_DIR = WORKSPACE / "panhandle-theme"
ASSETS_CSS = THEME_DIR / "assets" / "css"
ASSETS_JS = THEME_DIR / "assets" / "js"

# Create directories
for d in [WORKSPACE, THEME_DIR, ASSETS_CSS, ASSETS_JS]:
    d.mkdir(parents=True, exist_ok=True)

# --- docker-compose.yml ---
compose = """services:
  wordpress:
    image: wordpress:6.6
    container_name: panhandle-wordpress
    depends_on: [db]
    ports: ["8090:80"]
    restart: always
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: panhandle
      WORDPRESS_DB_USER: wp
      WORDPRESS_DB_PASSWORD: panhandle_wp_2026
      WORDPRESS_TABLE_PREFIX: ph_
    volumes:
      - panhandle_wp_data:/var/www/html
      - ./panhandle-theme:/var/www/html/wp-content/themes/panhandle-theme
  db:
    image: mysql:8.0
    container_name: panhandle-mysql
    restart: always
    environment:
      MYSQL_DATABASE: panhandle
      MYSQL_USER: wp
      MYSQL_PASSWORD: panhandle_wp_2026
      MYSQL_ROOT_PASSWORD: panhandle_root_2026
    volumes:
      - panhandle_db:/var/lib/mysql
volumes:
  panhandle_wp_data:
  panhandle_db:
"""
(WORKSPACE / "docker-compose.yml").write_text(compose)
print("docker-compose.yml written")

# --- functions.php ---
functions_php = r"""<?php
// Remove canonical redirect to prevent sub-path proxy loop
remove_filter('template_redirect', 'redirect_canonical');

// Login redirect filters for sub-path proxy
function panhandle_fix_wp_redirect($location, $status) {
    $base = 'https://api.michaelwegter.com/demos/panhandle-garage-door-company';
    if (strpos($location, 'http://') === 0 || strpos($location, 'https://127.0.0.1') === 0) {
        $location = preg_replace('#^https?://[^/]+#', $base, $location);
    }
    if (strpos($location, 'redirect_to=') !== false) {
        $location = preg_replace_callback('/redirect_to=([^&]+)/', function($m) use ($base) {
            $inner = urldecode($m[1]);
            $inner = preg_replace('#^https?://[^/]+#', $base, $inner);
            return 'redirect_to=' . urlencode($inner);
        }, $location);
    }
    return $location;
}
add_filter('wp_redirect', 'panhandle_fix_wp_redirect', 10, 2);

function panhandle_login_redirect($redirect_to, $request, $user) {
    return 'https://api.michaelwegter.com/demos/panhandle-garage-door-company/wp-admin/';
}
add_filter('login_redirect', 'panhandle_login_redirect', 10, 3);

function panhandle_login_url($login_url, $redirect, $force_reauth) {
    $base = 'https://api.michaelwegter.com/demos/panhandle-garage-door-company';
    return $base . '/wp-login.php';
}
add_filter('login_url', 'panhandle_login_url', 10, 3);

// Theme setup
function panhandle_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form','comment-form','comment-list','gallery','caption'));
    register_nav_menus(array(
        'primary'        => 'Primary Menu',
        'footer-services' => 'Footer Services',
        'footer-cities'  => 'Footer Cities',
    ));
}
add_action('after_setup_theme', 'panhandle_setup');

// Enqueue assets
function panhandle_assets() {
    wp_enqueue_style('google-fonts',
        'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600&family=Barlow:wght@500&display=swap',
        array(), null);
    wp_enqueue_style('panhandle-main', get_template_directory_uri() . '/assets/css/main.css', array('google-fonts'), '1.1');
    wp_enqueue_script('panhandle-main', get_template_directory_uri() . '/assets/js/main.js', array(), '1.1', true);
}
add_action('wp_enqueue_scripts', 'panhandle_assets');
"""
(THEME_DIR / "functions.php").write_text(functions_php)
print("functions.php written")

# --- style.css (WP theme header) ---
style_css = """/*
Theme Name: Panhandle Theme
Theme URI: https://api.michaelwegter.com/demos/panhandle-garage-door-company/
Author: Michael Wegter
Description: SEO-first WordPress theme for Dimitroff Door Repair
Version: 1.1
*/
"""
(THEME_DIR / "style.css").write_text(style_css)
print("style.css written")

# --- assets/css/main.css ---
main_css = """:root {
  --color-primary:   #1B3A5C;
  --color-cta:       #E85D04;
  --color-bg:        #F8F6F2;
  --color-text:      #1A1A1A;
  --color-secondary: #546E7A;
  --color-divider:   #DDD8CE;
  --color-white:     #FFFFFF;
  --font-heading: 'Barlow Condensed', sans-serif;
  --font-body:    'Source Sans 3', sans-serif;
  --font-nav:     'Barlow', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
}

a { color: var(--color-primary); text-decoration: none; }
a:hover { text-decoration: underline; }

img { max-width: 100%; height: auto; }

/* ---- HEADER ---- */
.site-header {
  background: var(--color-primary);
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  gap: 1rem;
}
.site-logo {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-white);
  letter-spacing: 0.04em;
  line-height: 1.1;
}
.site-logo span { color: var(--color-cta); display: block; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.header-phone a {
  color: var(--color-white);
  font-family: var(--font-nav);
  font-size: 1.05rem;
  font-weight: 500;
}
.btn-header-cta {
  background: var(--color-cta);
  color: var(--color-white) !important;
  font-family: var(--font-nav);
  font-weight: 500;
  padding: 0.55rem 1.2rem;
  border-radius: 4px;
  white-space: nowrap;
  text-decoration: none !important;
  transition: background 0.2s;
}
.btn-header-cta:hover { background: #c94e03; }
.primary-nav ul { list-style: none; display: flex; gap: 0.1rem; }
.primary-nav a {
  color: var(--color-white);
  font-family: var(--font-nav);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.5rem 0.7rem;
  border-radius: 3px;
  display: block;
  letter-spacing: 0.02em;
}
.primary-nav a:hover { background: rgba(255,255,255,0.1); text-decoration: none; }

/* ---- NAV HAMBURGER ---- */
.nav-toggle { display: none; background: none; border: none; cursor: pointer; padding: 0.4rem; }
.nav-toggle span { display: block; width: 24px; height: 2px; background: #fff; margin: 5px 0; border-radius: 2px; transition: all 0.2s; }

/* ---- HERO ---- */
.hero {
  background: linear-gradient(135deg, #1B3A5C 60%, #122840 100%);
  color: var(--color-white);
  padding: 5rem 1.5rem 4rem;
  text-align: center;
}
.hero h1 {
  font-family: var(--font-heading);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: 0.01em;
  margin-bottom: 1.2rem;
}
.hero h1 em { color: var(--color-cta); font-style: normal; }
.hero-sub {
  font-size: 1.15rem;
  opacity: 0.88;
  max-width: 680px;
  margin: 0 auto 2rem;
}
.hero-ctas { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.btn-cta-orange {
  background: var(--color-cta);
  color: #fff !important;
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.8rem 1.8rem;
  border-radius: 4px;
  text-decoration: none !important;
  transition: background 0.2s;
  display: inline-block;
}
.btn-cta-orange:hover { background: #c94e03; }
.btn-cta-outline {
  border: 2px solid rgba(255,255,255,0.7);
  color: #fff !important;
  font-family: var(--font-nav);
  font-weight: 500;
  font-size: 1.05rem;
  padding: 0.8rem 1.8rem;
  border-radius: 4px;
  text-decoration: none !important;
  transition: border-color 0.2s;
  display: inline-block;
}
.btn-cta-outline:hover { border-color: #fff; }

/* ---- TRUST STRIP ---- */
.trust-strip {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 0.85rem 1.5rem;
}
.trust-strip-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 2rem;
  justify-content: center;
  align-items: center;
}
.trust-item {
  font-family: var(--font-nav);
  font-size: 0.88rem;
  font-weight: 500;
  opacity: 0.92;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.trust-item::before { content: ""; width: 7px; height: 7px; background: var(--color-cta); border-radius: 50%; display: inline-block; }

/* ---- SECTION HEADERS ---- */
.section-header { text-align: center; margin-bottom: 2.5rem; }
.section-header h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.6rem;
}
.section-header p { color: var(--color-secondary); font-size: 1.05rem; max-width: 600px; margin: 0 auto; }

/* ---- SERVICES GRID ---- */
.services-section { padding: 4rem 1.5rem; max-width: 1200px; margin: 0 auto; }
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
.service-card {
  background: var(--color-white);
  border: 1px solid var(--color-divider);
  border-radius: 8px;
  padding: 1.75rem 1.5rem;
  transition: box-shadow 0.2s, transform 0.2s;
}
.service-card:hover { box-shadow: 0 8px 24px rgba(27,58,92,0.12); transform: translateY(-3px); }
.service-card .icon { font-size: 2.2rem; margin-bottom: 1rem; display: block; }
.service-card h3 {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.service-card p { font-size: 0.92rem; color: var(--color-secondary); margin-bottom: 1rem; }
.service-card a.card-link {
  color: var(--color-cta);
  font-weight: 600;
  font-size: 0.9rem;
  font-family: var(--font-nav);
}

/* ---- COVERAGE SECTION ---- */
.coverage-section {
  background: var(--color-primary);
  color: var(--color-white);
  padding: 4rem 1.5rem;
}
.coverage-inner { max-width: 1100px; margin: 0 auto; }
.coverage-inner h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
}
.coverage-inner p { text-align: center; opacity: 0.88; margin-bottom: 2rem; }
.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2rem;
}
.city-pill {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 0.6rem 1rem;
  text-align: center;
  font-family: var(--font-nav);
  font-size: 0.9rem;
  color: var(--color-white);
  text-decoration: none;
  transition: background 0.2s;
}
.city-pill:hover { background: rgba(232,93,4,0.35); text-decoration: none; color: #fff; }
.coverage-cta { text-align: center; }

/* ---- WHY US ---- */
.why-section { padding: 4rem 1.5rem; max-width: 1100px; margin: 0 auto; }
.why-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 2rem; }
.why-item { text-align: center; }
.why-item .why-icon { font-size: 2.5rem; margin-bottom: 0.75rem; display: block; }
.why-item h3 {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.4rem;
}
.why-item p { font-size: 0.92rem; color: var(--color-secondary); }

/* ---- CTA BAND ---- */
.cta-band { background: var(--color-cta); color: #fff; padding: 3.5rem 1.5rem; text-align: center; }
.cta-band h2 {
  font-family: var(--font-heading);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 700;
  margin-bottom: 0.6rem;
}
.cta-band p { font-size: 1.05rem; opacity: 0.92; margin-bottom: 1.5rem; }
.btn-cta-white {
  background: #fff;
  color: var(--color-cta) !important;
  font-family: var(--font-nav);
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0.85rem 2rem;
  border-radius: 4px;
  text-decoration: none !important;
  display: inline-block;
  margin: 0.3rem;
}
.btn-cta-white:hover { background: #f0f0f0; }
.btn-cta-dark {
  background: var(--color-primary);
  color: #fff !important;
  font-family: var(--font-nav);
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0.85rem 2rem;
  border-radius: 4px;
  text-decoration: none !important;
  display: inline-block;
  margin: 0.3rem;
}

/* ---- CONTENT PAGES ---- */
.page-content { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }
.page-content h1 {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
  line-height: 1.1;
}
.page-content h2 {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 2rem 0 0.75rem;
}
.page-content h3 {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 1.5rem 0 0.5rem;
}
.page-content p { margin-bottom: 1rem; line-height: 1.7; }
.page-content ul { margin: 0.75rem 0 1rem 1.5rem; }
.page-content ul li { margin-bottom: 0.4rem; line-height: 1.6; }
.page-meta-bar {
  background: var(--color-primary);
  color: #fff;
  padding: 3rem 1.5rem 2.5rem;
}
.page-meta-bar h1 {
  font-family: var(--font-heading);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.page-meta-bar .breadcrumb { font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.75rem; }
.page-meta-bar .breadcrumb a { color: #fff; }

/* ---- FAQ ---- */
.faq-section { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }
.faq-section h2 {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
}
.faq-item { border-bottom: 1px solid var(--color-divider); padding: 1.25rem 0; }
.faq-q { font-family: var(--font-nav); font-weight: 600; color: var(--color-primary); cursor: pointer; font-size: 1rem; }
.faq-q:hover { color: var(--color-cta); }
.faq-a { font-size: 0.95rem; color: var(--color-secondary); margin-top: 0.6rem; display: none; line-height: 1.6; }
.faq-item.open .faq-a { display: block; }

/* ---- FOOTER ---- */
.site-footer {
  background: #0f2035;
  color: rgba(255,255,255,0.8);
  padding: 3rem 1.5rem 1.5rem;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 2.5rem;
}
.footer-brand .logo-name {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.4rem;
}
.footer-brand .tagline { font-size: 0.85rem; color: var(--color-cta); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1rem; }
.footer-brand p { font-size: 0.88rem; line-height: 1.6; }
.footer-col h4 {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.footer-col ul { list-style: none; }
.footer-col ul li { margin-bottom: 0.5rem; }
.footer-col a { color: rgba(255,255,255,0.75); font-size: 0.88rem; }
.footer-col a:hover { color: #fff; text-decoration: none; }
.footer-contact .contact-item { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; font-size: 0.9rem; }
.footer-contact .contact-item a { color: rgba(255,255,255,0.8); }
.footer-bottom {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}
.trust-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.trust-badge {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.7);
}

/* ---- MOBILE STICKY BAR ---- */
.mobile-sticky-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: var(--color-primary);
  padding: 0.7rem 1rem;
  gap: 0.5rem;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.2);
}
.mobile-sticky-bar a {
  flex: 1;
  text-align: center;
  font-family: var(--font-nav);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 0.5rem;
  border-radius: 4px;
  text-decoration: none;
}
.btn-call { background: var(--color-white); color: var(--color-primary) !important; }
.btn-estimate { background: var(--color-cta); color: var(--color-white) !important; }

/* ---- BREADCRUMB ---- */
.breadcrumb-nav { padding: 0.75rem 1.5rem; background: #fff; border-bottom: 1px solid var(--color-divider); font-size: 0.82rem; }
.breadcrumb-nav a { color: var(--color-secondary); }
.breadcrumb-nav a:hover { color: var(--color-primary); }

/* ---- SEO AUDIT PAGE ---- */
.seo-audit-hero { padding: 3rem 1.5rem; text-align: center; max-width: 800px; margin: 0 auto; }
.seo-audit-hero h1 {
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 1rem;
}
.seo-audit-hero p { font-size: 1.05rem; color: var(--color-secondary); margin-bottom: 1.5rem; line-height: 1.7; }
.seo-audit-hero .hint { font-size: 0.88rem; color: var(--color-secondary); margin-top: 1rem; }
.seo-audit-hero code { background: #eee; padding: 0.1rem 0.4rem; border-radius: 3px; font-size: 0.85rem; }
.seo-audit-frame { width: 100%; border: none; min-height: 900px; margin-top: 2rem; display: block; }

/* ---- ESTIMATE FORM ---- */
.estimate-section { max-width: 700px; margin: 0 auto; padding: 3rem 1.5rem; }
.estimate-section h1 {
  font-family: var(--font-heading);
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.estimate-section p.sub { color: var(--color-secondary); margin-bottom: 2rem; }
.wpcf7 input, .wpcf7 textarea, .wpcf7 select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-divider);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  background: #fff;
}
.wpcf7 input:focus, .wpcf7 textarea:focus, .wpcf7 select:focus {
  outline: 2px solid var(--color-primary);
  border-color: var(--color-primary);
}
.wpcf7 input[type="submit"] {
  background: var(--color-cta);
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s;
  padding: 0.85rem 2rem;
  width: auto;
}
.wpcf7 input[type="submit"]:hover { background: #c94e03; }

/* ---- RESPONSIVE ---- */
@media (max-width: 768px) {
  .primary-nav { display: none; }
  .primary-nav.open { display: block; position: absolute; top: 68px; left: 0; right: 0; background: var(--color-primary); padding: 1rem; }
  .primary-nav.open ul { flex-direction: column; gap: 0; }
  .nav-toggle { display: block; }
  .mobile-sticky-bar { display: flex; }
  body { padding-bottom: 60px; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .header-phone { display: none; }
}

@media (max-width: 480px) {
  .footer-inner { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 0.75rem; text-align: center; }
}
"""
(ASSETS_CSS / "main.css").write_text(main_css)
print("main.css written (%d bytes)" % len(main_css))

# --- assets/js/main.js ---
main_js = """// Panhandle theme JS
document.addEventListener('DOMContentLoaded', function() {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
  }
  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function(q) {
    q.addEventListener('click', function() {
      var item = this.closest('.faq-item');
      item.classList.toggle('open');
    });
  });
});
"""
(ASSETS_JS / "main.js").write_text(main_js)
print("main.js written")

# --- header.php ---
header_php = r"""<?php
$base = 'https://api.michaelwegter.com/demos/panhandle-garage-door-company';
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="https://gmpg.org/xfn/11">
<?php wp_head(); ?>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "name": "Dimitroff Door Repair",
  "telephone": "(806) 316-5296",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "120 Amherst Avenue",
    "addressLocality": "Dumas",
    "addressRegion": "TX",
    "postalCode": "79029",
    "addressCountry": "US"
  },
  "openingHoursSpecification": [
    {"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:00","closes":"18:00"},
    {"@type":"OpeningHoursSpecification","dayOfWeek":["Saturday","Sunday"],"opens":"10:00","closes":"17:00"}
  ],
  "areaServed": ["Dumas TX","Amarillo TX","Borger TX","Pampa TX","Perryton TX","Dalhart TX","Hereford TX","Canyon TX","Friona TX","Clovis NM","Tucumcari NM","Clayton NM"],
  "url": "https://api.michaelwegter.com/demos/panhandle-garage-door-company/",
  "slogan": "One Company. Every Door."
}
</script>
</head>
<body <?php body_class(); ?>>
<header class="site-header">
  <div class="header-inner">
    <a href="<?php echo $base; ?>/" class="site-logo">
      Dimitroff Door Repair<span>One Company. Every Door.</span>
    </a>
    <nav class="primary-nav" id="primary-nav">
      <ul>
        <li><a href="<?php echo $base; ?>/services/">Services</a></li>
        <li><a href="<?php echo $base; ?>/residential/">Residential</a></li>
        <li><a href="<?php echo $base; ?>/commercial/">Commercial</a></li>
        <li><a href="<?php echo $base; ?>/service-area/">Service Area</a></li>
        <li><a href="<?php echo $base; ?>/blog/">Blog</a></li>
        <li><a href="<?php echo $base; ?>/free-seo-audit/">Free SEO Audit</a></li>
        <li><a href="<?php echo $base; ?>/contact/">Contact</a></li>
      </ul>
    </nav>
    <a href="tel:+18063165296" class="header-phone"><strong>(806) 316-5296</strong></a>
    <a href="<?php echo $base; ?>/estimate/" class="btn-header-cta">Get Free Estimate</a>
    <button class="nav-toggle" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
"""
(THEME_DIR / "header.php").write_text(header_php)
print("header.php written")

# --- footer.php ---
footer_php = r"""<?php
$base = 'https://api.michaelwegter.com/demos/panhandle-garage-door-company';
?>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="logo-name">Dimitroff Door Repair</div>
      <div class="tagline">One Company. Every Door.</div>
      <p>Serving the entire Texas Panhandle and Northeast New Mexico since 2010. Locally owned. Licensed &amp; insured.</p>
      <div class="trust-badges" style="margin-top:1rem">
        <span class="trust-badge">BBB Accredited</span>
        <span class="trust-badge">Se Habla Espanol</span>
        <span class="trust-badge">90-Day Warranty</span>
        <span class="trust-badge">Free Estimates</span>
      </div>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      <ul>
        <li><a href="<?php echo $base; ?>/services/residential-garage-doors/">Garage Door Repair</a></li>
        <li><a href="<?php echo $base; ?>/services/commercial-overhead-doors/">Commercial Overhead Doors</a></li>
        <li><a href="<?php echo $base; ?>/services/roll-up-doors/">Roll-Up Doors</a></li>
        <li><a href="<?php echo $base; ?>/services/storefront-doors/">Storefront Doors</a></li>
        <li><a href="<?php echo $base; ?>/services/barn-agricultural-doors/">Barn &amp; Ag Doors</a></li>
        <li><a href="<?php echo $base; ?>/services/entry-doors/">Entry Doors</a></li>
        <li><a href="<?php echo $base; ?>/services/dock-equipment/">Dock Equipment</a></li>
        <li><a href="<?php echo $base; ?>/services/window-repair-replacement/">Window Repair</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Cities We Serve</h4>
      <ul>
        <li><a href="<?php echo $base; ?>/service-area/dumas-tx/">Dumas, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/amarillo-tx/">Amarillo, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/pampa-tx/">Pampa, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/borger-tx/">Borger, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/perryton-tx/">Perryton, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/dalhart-tx/">Dalhart, TX</a></li>
        <li><a href="<?php echo $base; ?>/service-area/clovis-nm/">Clovis, NM</a></li>
        <li><a href="<?php echo $base; ?>/service-area/">All Cities &rarr;</a></li>
      </ul>
    </div>
    <div class="footer-col footer-contact">
      <h4>Contact</h4>
      <div class="contact-item">&#128205; 120 Amherst Ave, Dumas, TX 79029</div>
      <div class="contact-item">&#128222; <a href="tel:+18063165296">(806) 316-5296</a></div>
      <div class="contact-item">&#128337; Mon-Fri 8am-6pm | Sat-Sun 10am-5pm</div>
      <div class="contact-item" style="margin-top:1rem">
        <a href="<?php echo $base; ?>/estimate/" class="btn-cta-orange" style="font-size:0.9rem;padding:0.6rem 1.2rem">Get Free Estimate</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; <?php echo date('Y'); ?> Dimitroff Door Repair. All rights reserved.</span>
    <span><a href="<?php echo $base; ?>/free-seo-audit/" style="color:rgba(255,255,255,0.5)">Free SEO Audit Tool</a></span>
  </div>
</footer>
<div class="mobile-sticky-bar">
  <a href="tel:+18063165296" class="btn-call">&#128222; Call (806) 316-5296</a>
  <a href="<?php echo $base; ?>/estimate/" class="btn-estimate">Get Estimate</a>
</div>
<?php wp_footer(); ?>
</body>
</html>
"""
(THEME_DIR / "footer.php").write_text(footer_php)
print("footer.php written")

# --- index.php (required WP fallback) ---
index_php = r"""<?php
get_header();
if (have_posts()):
  while (have_posts()): the_post();
    echo '<div class="page-content">';
    the_content();
    echo '</div>';
  endwhile;
endif;
get_footer();
"""
(THEME_DIR / "index.php").write_text(index_php)
print("index.php written")

# --- page.php (generic) ---
page_php = r"""<?php
get_header();
?>
<div class="page-content">
<?php if (have_posts()): while (have_posts()): the_post(); ?>
  <h1><?php the_title(); ?></h1>
  <div class="entry-content"><?php the_content(); ?></div>
<?php endwhile; endif; ?>
</div>
<?php get_footer(); ?>
"""
(THEME_DIR / "page.php").write_text(page_php)
print("page.php written")

# --- front-page.php ---
front_page_php = r"""<?php
get_header();
$base = 'https://api.michaelwegter.com/demos/panhandle-garage-door-company';
?>
<section class="hero">
  <h1>The <em>Texas Panhandle's</em> Door Experts.<br>Every Door. Every Time.</h1>
  <p class="hero-sub">Garage doors, commercial overhead doors, roll-up doors, storefront doors, barn doors, dock equipment, and window repair. One company for every opening in your home or business.</p>
  <div class="hero-ctas">
    <a href="<?php echo $base; ?>/estimate/" class="btn-cta-orange">Get a Free Estimate</a>
    <a href="tel:+18063165296" class="btn-cta-outline">&#128222; (806) 316-5296</a>
  </div>
</section>
<div class="trust-strip">
  <div class="trust-strip-inner">
    <span class="trust-item">Free Estimates</span>
    <span class="trust-item">Same-Day Service Available</span>
    <span class="trust-item">90-Day Warranty</span>
    <span class="trust-item">Se Habla Espanol</span>
    <span class="trust-item">BBB Accredited</span>
    <span class="trust-item">Locally Owned &amp; Operated</span>
  </div>
</div>
<section class="services-section">
  <div class="section-header">
    <h2>One Company. Every Door.</h2>
    <p>From residential garage doors to commercial dock equipment, Dimitroff Door Repair handles it all across the Texas Panhandle and Northeast New Mexico.</p>
  </div>
  <div class="services-grid">
    <div class="service-card">
      <span class="icon">&#127968;</span>
      <h3>Residential Garage Doors</h3>
      <p>Repair, installation, and spring replacement for every garage door brand. Same-day service in most of the Panhandle.</p>
      <a href="<?php echo $base; ?>/services/residential-garage-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#127981;</span>
      <h3>Commercial Overhead Doors</h3>
      <p>Heavy-duty commercial overhead door solutions for warehouses, retail, and industrial facilities.</p>
      <a href="<?php echo $base; ?>/services/commercial-overhead-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#129521;</span>
      <h3>Roll-Up Doors</h3>
      <p>Coiling roll-up doors for self-storage, commercial units, and agricultural buildings. Installation and repair.</p>
      <a href="<?php echo $base; ?>/services/roll-up-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#128682;</span>
      <h3>Storefront Doors</h3>
      <p>Aluminum storefront door repair and replacement for retail, restaurant, and commercial properties.</p>
      <a href="<?php echo $base; ?>/services/storefront-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#127864;</span>
      <h3>Barn &amp; Agricultural Doors</h3>
      <p>Sliding barn doors, overhead ag doors, and large-opening solutions for Panhandle farms and ranches.</p>
      <a href="<?php echo $base; ?>/services/barn-agricultural-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#128682;</span>
      <h3>Entry Doors</h3>
      <p>Steel, fiberglass, and wood entry door installation and repair for homes and commercial buildings.</p>
      <a href="<?php echo $base; ?>/services/entry-doors/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#128674;</span>
      <h3>Dock Equipment</h3>
      <p>Loading dock levelers, dock seals, bumpers, and dock door service for commercial and industrial properties.</p>
      <a href="<?php echo $base; ?>/services/dock-equipment/" class="card-link">Learn More &rarr;</a>
    </div>
    <div class="service-card">
      <span class="icon">&#129695;</span>
      <h3>Window Repair &amp; Replacement</h3>
      <p>Residential and commercial window repair and replacement throughout the Texas Panhandle.</p>
      <a href="<?php echo $base; ?>/services/window-repair-replacement/" class="card-link">Learn More &rarr;</a>
    </div>
  </div>
</section>
<section class="coverage-section">
  <div class="coverage-inner">
    <h2>Serving the Entire Texas Panhandle &amp; NE New Mexico</h2>
    <p>We are the only door company with dedicated service pages for every major community in the region. No big-city pricing, no driving-out-from-Amarillo delays.</p>
    <div class="cities-grid">
      <a href="<?php echo $base; ?>/service-area/dumas-tx/" class="city-pill">Dumas, TX (HQ)</a>
      <a href="<?php echo $base; ?>/service-area/amarillo-tx/" class="city-pill">Amarillo, TX</a>
      <a href="<?php echo $base; ?>/service-area/pampa-tx/" class="city-pill">Pampa, TX</a>
      <a href="<?php echo $base; ?>/service-area/borger-tx/" class="city-pill">Borger, TX</a>
      <a href="<?php echo $base; ?>/service-area/perryton-tx/" class="city-pill">Perryton, TX</a>
      <a href="<?php echo $base; ?>/service-area/dalhart-tx/" class="city-pill">Dalhart, TX</a>
      <a href="<?php echo $base; ?>/service-area/hereford-tx/" class="city-pill">Hereford, TX</a>
      <a href="<?php echo $base; ?>/service-area/canyon-tx/" class="city-pill">Canyon, TX</a>
      <a href="<?php echo $base; ?>/service-area/friona-tx/" class="city-pill">Friona, TX</a>
      <a href="<?php echo $base; ?>/service-area/clovis-nm/" class="city-pill">Clovis, NM</a>
      <a href="<?php echo $base; ?>/service-area/tucumcari-nm/" class="city-pill">Tucumcari, NM</a>
      <a href="<?php echo $base; ?>/service-area/clayton-nm/" class="city-pill">Clayton, NM</a>
    </div>
    <div class="coverage-cta">
      <a href="<?php echo $base; ?>/service-area/" class="btn-cta-orange">View Full Service Area</a>
    </div>
  </div>
</section>
<section class="why-section">
  <div class="section-header">
    <h2>Why Choose Dimitroff Door Repair?</h2>
    <p>We are not a national franchise. We are your neighbors.</p>
  </div>
  <div class="why-grid">
    <div class="why-item">
      <span class="why-icon">&#9889;</span>
      <h3>Same-Day Service</h3>
      <p>Broken door? We dispatch fast. Most Panhandle locations covered within hours, not days.</p>
    </div>
    <div class="why-item">
      <span class="why-icon">&#128205;</span>
      <h3>Locally Owned</h3>
      <p>Based in Dumas, TX. Your money stays in the Panhandle. We know the region because we live here.</p>
    </div>
    <div class="why-item">
      <span class="why-icon">&#127942;</span>
      <h3>90-Day Warranty</h3>
      <p>Every repair is backed by our 90-day warranty. If it fails, we fix it. Period.</p>
    </div>
    <div class="why-item">
      <span class="why-icon">&#127760;</span>
      <h3>Se Habla Espanol</h3>
      <p>Bilingual team. We serve every community in the Panhandle, including our Spanish-speaking neighbors.</p>
    </div>
    <div class="why-item">
      <span class="why-icon">&#127970;</span>
      <h3>Every Door Type</h3>
      <p>One call covers every door on your property. Residential, commercial, agricultural, roll-up, dock.</p>
    </div>
    <div class="why-item">
      <span class="why-icon">&#128184;</span>
      <h3>Free Estimates</h3>
      <p>No surprise fees. We give you a clear, itemized estimate before any work begins.</p>
    </div>
  </div>
</section>
<section class="cta-band">
  <h2>Ready to Fix Your Door? Call or Get a Free Estimate.</h2>
  <p>We serve Dumas, Amarillo, Pampa, Borger, Perryton, Dalhart, Clovis, and every community in between.</p>
  <a href="tel:+18063165296" class="btn-cta-white">&#128222; (806) 316-5296</a>
  <a href="<?php echo $base; ?>/estimate/" class="btn-cta-dark">Request Estimate Online</a>
</section>
<?php get_footer(); ?>
"""
(THEME_DIR / "front-page.php").write_text(front_page_php)
print("front-page.php written")

# --- page-seo-audit.php ---
seo_audit_php = r"""<?php
get_header();
?>
<div class="page-meta-bar">
  <div style="max-width:900px;margin:0 auto;padding:0 1.5rem">
    <div class="breadcrumb"><a href="https://api.michaelwegter.com/demos/panhandle-garage-door-company/">Home</a> &rsaquo; Free SEO Audit</div>
    <h1>Free SEO Site Analysis</h1>
    <p style="opacity:0.88;max-width:600px">Analyze any website for technical SEO issues, Core Web Vitals, schema markup, meta tags, internal linking, and keyword density.</p>
  </div>
</div>
<div class="seo-audit-hero">
  <p>As part of this proposal, I built a live SEO analysis tool that runs real Playwright-based crawls. Create a free account with any email and password to get started. Try analyzing the Dimitroff Door Repair demo site or any other URL.</p>
  <a href="https://mwegter95.github.io/free-seo-analyzer-with-js-rendering/" target="_blank" rel="noopener" class="btn-cta-orange">
    Launch Free SEO Analyzer &rarr;
  </a>
  <p class="hint">Sign up with any email address and password (minimum 8 characters).<br>Try analyzing: <code>https://api.michaelwegter.com/demos/panhandle-garage-door-company/</code></p>
</div>
<iframe
  src="https://mwegter95.github.io/free-seo-analyzer-with-js-rendering/"
  width="100%"
  height="950"
  style="border:none;display:block;margin:0 auto 2rem"
  title="Free SEO Analyzer by Michael Wegter"></iframe>
<?php get_footer(); ?>
"""
(THEME_DIR / "page-seo-audit.php").write_text(seo_audit_php)
print("page-seo-audit.php written")

# --- single.php ---
single_php = r"""<?php
get_header();
?>
<div class="page-meta-bar">
  <div style="max-width:900px;margin:0 auto;padding:0 1.5rem">
    <div class="breadcrumb"><a href="https://api.michaelwegter.com/demos/panhandle-garage-door-company/">Home</a> &rsaquo; <a href="https://api.michaelwegter.com/demos/panhandle-garage-door-company/blog/">Blog</a> &rsaquo; <?php the_title(); ?></div>
    <h1><?php the_title(); ?></h1>
    <p style="opacity:0.8;font-size:0.9rem"><?php echo get_the_date(); ?></p>
  </div>
</div>
<div class="page-content">
<?php if (have_posts()): while (have_posts()): the_post(); ?>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"<?php echo esc_js(get_the_title()); ?>","datePublished":"<?php echo get_the_date('c'); ?>","author":{"@type":"Organization","name":"Dimitroff Door Repair"}}
  </script>
  <div class="entry-content"><?php the_content(); ?></div>
<?php endwhile; endif; ?>
</div>
<?php get_footer(); ?>
"""
(THEME_DIR / "single.php").write_text(single_php)
print("single.php written")

print("=== ALL THEME FILES WRITTEN ===")
print("Workspace: panhandle_wp/")
print("Theme: panhandle_wp/panhandle-theme/")
