# WP-CLI content seeding for panhandle-garage-door-company
# ASCII-only. Idempotent. Run via surface_run.py after containers are LISTENING.
import subprocess
import sys
import time

CONTAINER = "panhandle-wordpress"
BASE = "https://api.michaelwegter.com/demos/panhandle-garage-door-company"


def wp(cmd):
    """Run wp-cli in the container."""
    full = ["docker", "exec", CONTAINER, "wp"] + cmd + ["--allow-root"]
    result = subprocess.run(full, capture_output=True, text=True)
    out = result.stdout.strip()
    err = result.stderr.strip()
    if out:
        print("  OUT:", out[:300])
    if err and "Warning" not in err and "Notice" not in err:
        print("  ERR:", err[:300])
    return result.returncode


def wait_for_wp():
    """Wait for WP container to be ready."""
    print("Waiting for WP container...")
    deadline = time.time() + 90
    while time.time() < deadline:
        r = subprocess.run(
            ["docker", "exec", CONTAINER, "wp", "core", "is-installed", "--allow-root"],
            capture_output=True
        )
        if r.returncode == 0:
            print("WP is installed and ready")
            return True
        time.sleep(4)
    return False


def create_page(title, slug, content, parent_id=0):
    """Create or update a page by slug. Returns post ID."""
    # Check if exists
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "wp", "post", "list",
         "--post_type=page", "--post_status=publish",
         "--fields=ID,post_name", "--format=csv", "--allow-root"],
        capture_output=True, text=True
    )
    for line in r.stdout.splitlines():
        parts = line.split(",")
        if len(parts) >= 2 and parts[1].strip() == slug:
            pid = parts[0].strip()
            print("  Page '%s' exists as ID %s, updating..." % (slug, pid))
            wp(["post", "update", pid,
                "--post_title=" + title,
                "--post_content=" + content,
                "--post_status=publish"])
            return pid

    args = ["post", "create",
            "--post_type=page",
            "--post_status=publish",
            "--post_title=" + title,
            "--post_name=" + slug,
            "--post_content=" + content,
            "--porcelain"]
    if parent_id:
        args.append("--post_parent=" + str(parent_id))
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "wp"] + args + ["--allow-root"],
        capture_output=True, text=True
    )
    pid = r.stdout.strip()
    print("  Created page '%s' ID=%s" % (slug, pid))
    return pid


def main():
    if not wait_for_wp():
        print("FATAL: WP not ready after 90s")
        sys.exit(1)

    # 1. Core install
    print("=== WP Core Install ===")
    wp(["core", "install",
        "--url=" + BASE,
        "--title=Dimitroff Door Repair | One Company. Every Door.",
        "--admin_user=admin",
        "--admin_password=DimitroffAdmin2026!",
        "--admin_email=admin@dimitroffdoorrepair.com",
        "--skip-email"])

    # 2. Options
    print("=== Options ===")
    wp(["option", "update", "siteurl", BASE])
    wp(["option", "update", "home", BASE])
    wp(["option", "update", "blogdescription", "Garage Door & Commercial Door Repair | Texas Panhandle & NE New Mexico"])
    wp(["rewrite", "structure", "/%postname%/", "--hard"])

    # 3. Plugins
    print("=== Plugins ===")
    wp(["plugin", "install", "wordpress-seo", "--activate"])
    wp(["plugin", "install", "contact-form-7", "--activate"])
    wp(["plugin", "install", "wp-super-cache", "--activate"])

    # 4. Theme
    print("=== Theme ===")
    wp(["theme", "activate", "panhandle-theme"])

    # 5. Delete default pages/posts
    print("=== Cleanup defaults ===")
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "wp", "post", "list",
         "--post_type=post,page", "--format=ids", "--allow-root"],
        capture_output=True, text=True
    )
    ids = r.stdout.strip()
    if ids:
        wp(["post", "delete"] + ids.split() + ["--force"])

    # 6. Create homepage
    print("=== Homepage ===")
    homepage_id = create_page("Home", "home-page",
        "<!-- Homepage rendered by front-page.php -->"
    )
    wp(["option", "update", "show_on_front", "page"])
    if homepage_id:
        wp(["option", "update", "page_on_front", str(homepage_id)])

    # 7. Services hub
    print("=== Services ===")
    services_content = """<h1>Our Services</h1>
<p>Dimitroff Door Repair is the Texas Panhandle's only full-service door company. We handle every door type for residential, commercial, and agricultural customers across the Texas Panhandle and Northeast New Mexico.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem;margin-top:2rem">
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/residential-garage-doors/">Residential Garage Doors</a></h3><p>Spring replacement, panel repair, new door installation. Same-day service available.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/commercial-overhead-doors/">Commercial Overhead Doors</a></h3><p>Heavy-duty commercial solutions for warehouses, retail, and industrial facilities.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/roll-up-doors/">Roll-Up Doors</a></h3><p>Coiling roll-up doors for storage units, shops, and agricultural buildings.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/storefront-doors/">Storefront Doors</a></h3><p>Aluminum storefront door repair and replacement for commercial properties.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/barn-agricultural-doors/">Barn &amp; Agricultural Doors</a></h3><p>Sliding barn doors, overhead ag doors, and large-opening solutions for Panhandle farms.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/entry-doors/">Entry Doors</a></h3><p>Steel, fiberglass, and wood entry door installation and repair.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/dock-equipment/">Dock Equipment</a></h3><p>Loading dock levelers, seals, bumpers, and dock door service.</p></div>
<div style="background:#fff;border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem"><h3><a href="%s/services/window-repair-replacement/">Window Repair &amp; Replacement</a></h3><p>Residential and commercial window repair and replacement.</p></div>
</div>
<p style="margin-top:2rem;text-align:center"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.85rem 2rem;border-radius:4px;text-decoration:none;font-weight:600">Get a Free Estimate</a></p>""" % tuple([BASE] * 9)
    services_id = create_page("Services", "services", services_content)

    # 8. Service child pages
    print("=== Service Pages ===")
    service_pages = [
        ("residential-garage-doors", "Garage Door Repair & Installation in the Texas Panhandle",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem">
<div style="max-width:900px;margin:0 auto">
<p style="font-size:0.85rem;opacity:0.7;margin-bottom:0.5rem"><a href="%s/" style="color:#fff">Home</a> &rsaquo; <a href="%s/services/" style="color:#fff">Services</a> &rsaquo; Garage Door Repair</p>
<h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700;margin-bottom:0.5rem">Garage Door Repair &amp; Installation in the Texas Panhandle</h1>
<p style="opacity:0.88">Dimitroff Door Repair provides fast, reliable garage door repair and installation for homeowners throughout Dumas, Amarillo, Pampa, Borger, and every community in the Texas Panhandle.</p>
</div></div>
<div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"Garage Door Repair","provider":{"@type":"LocalBusiness","name":"Dimitroff Door Repair","telephone":"(806) 316-5296"},"areaServed":"Texas Panhandle","description":"Garage door repair and installation for residential customers across the Texas Panhandle."}</script>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin-bottom:1rem">Texas Panhandle Garage Door Specialists</h2>
<p>When your garage door breaks, you need fast, local service. Dimitroff Door Repair is based in Dumas, TX and covers the entire Texas Panhandle, including Amarillo, Pampa, Borger, Perryton, Dalhart, Canyon, and every community in between. We are not a franchise or a big-city company charging travel fees. We are your neighbors.</p>
<p>Our technicians carry the parts most commonly needed for springs, cables, rollers, panels, and openers, so most repairs are completed on the first visit.</p>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Services We Provide</h2>
<ul><li>Broken spring replacement (torsion and extension springs)</li><li>Cable repair and replacement</li><li>Panel replacement and dent repair</li><li>Garage door opener installation and repair</li><li>New garage door installation (residential)</li><li>Weather seal and bottom seal replacement</li><li>Roller and hinge replacement</li><li>Garage door tune-up and safety inspection</li></ul>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Frequently Asked Questions</h2>
<div style="border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem;margin-bottom:1rem"><strong style="color:#1B3A5C">Q: How quickly can you come out for a garage door repair in the Texas Panhandle?</strong><p style="margin-top:0.5rem">We offer same-day service for most locations in the Texas Panhandle. Call us at (806) 316-5296 and we will dispatch a technician as quickly as possible.</p></div>
<div style="border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem;margin-bottom:1rem"><strong style="color:#1B3A5C">Q: Do you charge extra for service calls outside Dumas, TX?</strong><p style="margin-top:0.5rem">We serve the entire Panhandle with fair, transparent pricing. Get a free estimate before any work begins.</p></div>
<div style="border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem;margin-bottom:1rem"><strong style="color:#1B3A5C">Q: What brands of garage doors and openers do you work on?</strong><p style="margin-top:0.5rem">We service all major brands including Clopay, Wayne Dalton, Amarr, LiftMaster, Chamberlain, Genie, and more.</p></div>
<div style="text-align:center;margin-top:2.5rem;padding:2rem;background:#F8F6F2;border-radius:8px">
<h3 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem">Need a Garage Door Repair in the Texas Panhandle?</h3>
<p>Call us today or request a free estimate online. Se Habla Espanol.</p>
<a href="tel:+18063165296" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">(806) 316-5296</a>
<a href="%s/estimate/" style="background:#1B3A5C;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">Get Free Estimate</a>
</div></div>""" % (BASE, BASE, BASE)),
        ("commercial-overhead-doors", "Commercial Overhead Door Experts for Texas Panhandle Businesses",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem">
<div style="max-width:900px;margin:0 auto">
<p style="font-size:0.85rem;opacity:0.7;margin-bottom:0.5rem"><a href="%s/" style="color:#fff">Home</a> &rsaquo; <a href="%s/services/" style="color:#fff">Services</a> &rsaquo; Commercial Overhead Doors</p>
<h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700;margin-bottom:0.5rem">Commercial Overhead Door Experts for Texas Panhandle Businesses</h1>
<p style="opacity:0.88">Dimitroff Door Repair installs, repairs, and maintains commercial overhead doors for warehouses, distribution centers, auto shops, retail, and industrial facilities throughout the Texas Panhandle and NE New Mexico.</p>
</div></div>
<div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"Commercial Overhead Door Service","provider":{"@type":"LocalBusiness","name":"Dimitroff Door Repair","telephone":"(806) 316-5296"},"areaServed":"Texas Panhandle","description":"Commercial overhead door installation, repair, and maintenance for businesses in the Texas Panhandle."}</script>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin-bottom:1rem">Commercial Overhead Door Solutions</h2>
<p>A failed commercial overhead door means lost time, security risks, and operational disruption. Dimitroff Door Repair provides fast commercial door service with the parts and experience to handle heavy-duty commercial and industrial doors.</p>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Commercial Door Services</h2>
<ul><li>Commercial overhead door installation and replacement</li><li>Sectional steel door repair</li><li>High-cycle spring and cable service</li><li>Commercial door opener installation (LiftMaster, Genie commercial)</li><li>Emergency commercial door repair</li><li>Preventive maintenance programs</li><li>New construction commercial door packages</li></ul>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Industries We Serve</h2>
<ul><li>Warehouses and distribution centers</li><li>Auto repair shops and dealerships</li><li>Agricultural co-ops and grain elevators</li><li>Retail and strip center tenants</li><li>Oil field service companies (Borger, Pampa, Perryton)</li><li>Municipal and government facilities</li></ul>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Frequently Asked Questions</h2>
<div style="border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem;margin-bottom:1rem"><strong style="color:#1B3A5C">Q: Do you offer emergency commercial door repair?</strong><p style="margin-top:0.5rem">Yes. A commercial door that will not close is a security emergency. Call (806) 316-5296 and we will dispatch immediately.</p></div>
<div style="border:1px solid #DDD8CE;border-radius:8px;padding:1.5rem;margin-bottom:1rem"><strong style="color:#1B3A5C">Q: Can you service commercial doors in Amarillo or Borger?</strong><p style="margin-top:0.5rem">Yes. We cover Amarillo, Borger, Pampa, and every major commercial hub in the Texas Panhandle.</p></div>
<div style="text-align:center;margin-top:2.5rem;padding:2rem;background:#F8F6F2;border-radius:8px">
<h3 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem">Commercial Door Emergency?</h3>
<a href="tel:+18063165296" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">(806) 316-5296</a>
<a href="%s/estimate/" style="background:#1B3A5C;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">Get Free Estimate</a>
</div></div>""" % (BASE, BASE, BASE)),
        ("roll-up-doors", "Roll-Up Door Installation & Repair -- Panhandle TX & NM",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Roll-Up Door Installation &amp; Repair -- Panhandle TX &amp; NM</h1><p style="opacity:0.88">Roll-up doors for self-storage, mini-storage, shops, and commercial facilities. Service throughout the Texas Panhandle and NE New Mexico.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Dimitroff Door Repair specializes in coiling roll-up door installation and repair. Whether you need a new roll-up for a self-storage unit, a farm shop, or a commercial loading bay, we supply and install quality roll-up doors that hold up to the Texas Panhandle climate.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Roll-Up Door Applications</h2><ul><li>Self-storage and mini-storage facilities</li><li>Farm shops and machine sheds</li><li>Commercial loading bays and warehouses</li><li>Oil field service buildings</li><li>Retail storage rooms</li><li>Fire stations and municipal buildings</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
        ("storefront-doors", "Storefront Door Repair & Replacement -- Texas Panhandle",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Storefront Door Repair &amp; Replacement -- Texas Panhandle</h1><p style="opacity:0.88">Aluminum storefront door service for retail, restaurant, and commercial tenants across the Texas Panhandle.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>A broken storefront door impacts your business image and security. Dimitroff Door Repair provides same-day storefront door repair for retail centers, restaurants, medical offices, and commercial properties throughout Amarillo, Dumas, Pampa, and the entire Texas Panhandle.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Storefront Door Services</h2><ul><li>Aluminum storefront door repair and replacement</li><li>Closer adjustment and replacement</li><li>Glass panel replacement (tempered and safety glass)</li><li>Hardware and locking mechanism repair</li><li>ADA compliance adjustments</li><li>Emergency board-up after break-in</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
        ("barn-agricultural-doors", "Barn & Agricultural Door Specialists for Panhandle Farms & Ranches",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Barn &amp; Agricultural Door Specialists for Panhandle Farms &amp; Ranches</h1><p style="opacity:0.88">Sliding barn doors, overhead ag doors, and large-opening solutions for farms, ranches, and feedlots in the Texas Panhandle and NE New Mexico.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>The Texas Panhandle is cattle, grain, and farming country. Dimitroff Door Repair understands agricultural operations and provides barn and agricultural door solutions built to handle the demands of Panhandle farming and ranching. From Dalhart to Clayton, NM, we cover it all.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Ag Door Services</h2><ul><li>Sliding barn door installation and track repair</li><li>Overhead agricultural doors for machine sheds</li><li>Large-opening doors for grain handling equipment</li><li>Roll-up doors for barns and shops</li><li>Feedlot and livestock facility doors</li><li>Wind-rated doors for open Panhandle sites</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
        ("entry-doors", "Entry Door Installation & Repair -- Dumas TX & Surrounding Area",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Entry Door Installation &amp; Repair -- Dumas TX &amp; Surrounding Area</h1><p style="opacity:0.88">Steel, fiberglass, and wood entry door installation and repair for homes and commercial buildings throughout the Texas Panhandle.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Dimitroff Door Repair handles entry "man" doors for residential and commercial properties. We install and repair steel, fiberglass, and wood entry doors, including frames, hardware, locks, and weatherstripping.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Entry Door Services</h2><ul><li>New entry door installation (steel, fiberglass, wood)</li><li>Entry door frame repair and replacement</li><li>Deadbolt and lock installation</li><li>Weatherstripping and door sweep replacement</li><li>Exterior door re-hang and adjustment</li><li>Storm door installation</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
        ("dock-equipment", "Dock Equipment Service & Repair -- Texas Panhandle Commercial",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Dock Equipment Service &amp; Repair -- Texas Panhandle Commercial</h1><p style="opacity:0.88">Loading dock levelers, dock seals, bumpers, and dock door service for commercial and industrial facilities in the Texas Panhandle.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Dimitroff Door Repair services all types of loading dock equipment for distribution centers, warehouses, feed co-ops, and industrial facilities across the Texas Panhandle. A functional loading dock is critical to your operation. We provide fast, professional dock equipment service.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Dock Equipment Services</h2><ul><li>Hydraulic and mechanical dock leveler repair and installation</li><li>Dock seal and shelter replacement</li><li>Dock bumper installation</li><li>Dock door (overhead) repair and replacement</li><li>Edge-of-dock leveler installation</li><li>Loading dock safety inspection and maintenance</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
        ("window-repair-replacement", "Window Repair & Replacement -- Residential & Commercial, TX Panhandle",
         """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Window Repair &amp; Replacement -- Residential &amp; Commercial, TX Panhandle</h1><p style="opacity:0.88">Window repair and replacement for homes and businesses in Dumas, Amarillo, Pampa, and throughout the Texas Panhandle.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Dimitroff Door Repair has expanded to include window repair and replacement for residential and commercial customers. The Panhandle wind and weather are hard on windows. We provide fast, professional window service so you are not waiting days for a big-city company to drive out.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Window Services</h2><ul><li>Insulated glass unit (IGU) replacement (foggy windows)</li><li>Window frame repair and re-glazing</li><li>Screen repair and replacement</li><li>Vinyl and aluminum window replacement</li><li>Commercial storefront glass replacement</li><li>Emergency window board-up</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></div></div>""" % BASE),
    ]
    for slug, title, content in service_pages:
        if services_id:
            create_page(title, slug, content, parent_id=services_id)
        else:
            create_page(title, slug, content)

    # 9. Service area hub + city pages
    print("=== Service Area ===")
    sa_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Service Area -- Texas Panhandle &amp; NE New Mexico</h1><p style="opacity:0.88">Dimitroff Door Repair serves every major community in the Texas Panhandle and Northeast New Mexico. No big-city pricing, no long waits.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>We are based in Dumas, TX and cover a 150+ mile radius, including all major cities and rural communities in the Texas Panhandle and extending into Northeast New Mexico. Select your city below to see local service details.</p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:2rem">
<a href="%s/service-area/dumas-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Dumas, TX</strong><br><span style="font-size:0.8rem;opacity:0.75">Headquarters</span></a>
<a href="%s/service-area/amarillo-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Amarillo, TX</strong></a>
<a href="%s/service-area/pampa-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Pampa, TX</strong></a>
<a href="%s/service-area/borger-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Borger, TX</strong></a>
<a href="%s/service-area/perryton-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Perryton, TX</strong></a>
<a href="%s/service-area/dalhart-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Dalhart, TX</strong></a>
<a href="%s/service-area/hereford-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Hereford, TX</strong></a>
<a href="%s/service-area/canyon-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Canyon, TX</strong></a>
<a href="%s/service-area/friona-tx/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Friona, TX</strong></a>
<a href="%s/service-area/clovis-nm/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Clovis, NM</strong></a>
<a href="%s/service-area/tucumcari-nm/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Tucumcari, NM</strong></a>
<a href="%s/service-area/clayton-nm/" style="background:#1B3A5C;color:#fff;border-radius:6px;padding:1rem;text-align:center;text-decoration:none;display:block"><strong>Clayton, NM</strong></a>
</div></div>""" % tuple([BASE] * 12)
    sa_id = create_page("Service Area", "service-area", sa_content)

    city_pages = [
        ("dumas-tx", "Garage Door & Commercial Door Repair in Dumas, TX",
         "Dumas, TX", "our hometown and headquarters",
         "Dumas is where Dimitroff Door Repair was founded and where we are based. As the county seat of Moore County, Dumas is our home community. When you call Dimitroff Door Repair, you are calling a Dumas business that supports the local economy, schools, and community. We provide the fastest response times in Dumas for garage door repair, commercial overhead door service, and every other door type."),
        ("amarillo-tx", "Garage Door Repair in Amarillo, TX -- Dimitroff Door Repair",
         "Amarillo, TX", "the largest city in the Texas Panhandle",
         "Amarillo is the largest city in the Texas Panhandle and home to a large concentration of residential and commercial door service needs. Dimitroff Door Repair serves Amarillo with the same fast, locally-focused service we provide throughout the Panhandle. We are a real alternative to the national franchise chains operating in Amarillo, with transparent pricing and no big-city markups."),
        ("pampa-tx", "Garage Door Service in Pampa, TX",
         "Pampa, TX", "home to oil, gas, and growing residential neighborhoods",
         "Pampa is a strong commercial and residential market with active oil and gas industry facilities. Dimitroff Door Repair serves both residential homeowners and commercial operators in Pampa, including oil field service companies needing industrial overhead door and roll-up door service."),
        ("borger-tx", "Commercial Overhead Door & Dock Equipment Service in Borger, TX",
         "Borger, TX", "the industrial heart of the Panhandle with major refinery and chemical plant operations",
         "Borger's refinery and chemical complex creates strong demand for heavy-duty commercial overhead doors, roll-up doors, and dock equipment service. Dimitroff Door Repair is the only locally-focused door company with dedicated service for Borger's industrial and commercial operations."),
        ("perryton-tx", "Garage Door Repair in Perryton, TX -- Your Local Door Experts",
         "Perryton, TX", "the hub of Ochiltree County and surrounding wheat country",
         "Perryton and Ochiltree County are largely underserved by door companies based in Amarillo. Dimitroff Door Repair closes that gap with direct service to Perryton homeowners and agricultural operations. We carry parts for all major garage door brands and provide same-day service whenever possible."),
        ("dalhart-tx", "Barn & Garage Door Installation in Dalhart, TX",
         "Dalhart, TX", "cattle and agricultural community at the far western edge of the Texas Panhandle",
         "Dalhart serves a large agricultural area where barn doors, sliding ag doors, and overhead machine shed doors are in constant demand. Dimitroff Door Repair provides specialized agricultural door service for Dalhart-area farms, ranches, and feedlots, plus residential garage door repair for the growing Dalhart community."),
        ("hereford-tx", "Commercial Overhead & Roll-Up Doors in Hereford, TX",
         "Hereford, TX", "the beef capital of the world with major feedlot and agricultural operations",
         "Hereford's large feedlot and agricultural processing facilities require heavy-duty commercial overhead doors, roll-up doors, and specialty ag door solutions. Dimitroff Door Repair provides the commercial door expertise that Hereford businesses need, plus residential garage door service for Hereford homeowners."),
        ("canyon-tx", "Garage Door Repair & Installation in Canyon, TX",
         "Canyon, TX", "a fast-growing residential community near Amarillo",
         "Canyon is one of the fastest-growing communities in the Texas Panhandle, with significant residential development near the West Texas A&M University campus. Dimitroff Door Repair serves Canyon homeowners with fast residential garage door repair, new garage door installation, and entry door services."),
        ("friona-tx", "Garage Door & Agricultural Door Service in Friona, TX",
         "Friona, TX", "an agricultural community in Parmer County with strong farming and ranching roots",
         "Friona serves a large agricultural region where barn doors, overhead ag doors, and residential garage doors are common service needs. Dimitroff Door Repair provides reliable door service for Friona-area farms, ranches, and homeowners who need a local company, not a big-city franchise."),
        ("clovis-nm", "Garage Door & Commercial Door Repair in Clovis, NM",
         "Clovis, NM", "home to Cannon Air Force Base and a growing commercial market just across the NM border",
         "Dimitroff Door Repair extends service across the state line into Clovis, NM. Clovis has significant commercial and military-adjacent demand for garage door repair and commercial overhead door service. We serve Clovis with the same fair pricing and fast response as our Texas Panhandle locations. Se Habla Espanol."),
        ("tucumcari-nm", "Garage Door Repair in Tucumcari, NM",
         "Tucumcari, NM", "a historic Route 66 community with commercial and residential door service needs",
         "Tucumcari sits on I-40 with a mix of commercial properties, historic storefronts, and residential neighborhoods. Dimitroff Door Repair provides storefront door repair, residential garage door service, and commercial overhead door service for Tucumcari businesses and homeowners who are otherwise underserved by regional door companies."),
        ("clayton-nm", "Barn & Garage Door Service in Clayton, NM",
         "Clayton, NM", "a cattle and ranch community at the far eastern edge of our service territory",
         "Clayton is deep cattle country in Union County, NM, where barn doors, agricultural overhead doors, and ranch facility roll-ups are everyday needs. Dimitroff Door Repair reaches Clayton with no competing local provider, making us the go-to door company for the entire Clayton area."),
    ]
    for slug, title, city, angle, description in city_pages:
        content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Does Dimitroff Door Repair serve %s?","acceptedAnswer":{"@type":"Answer","text":"Yes. We provide garage door repair, commercial overhead door service, and all door types in %s. Call (806) 316-5296."}}]}</script>
<p style="font-size:0.85rem;opacity:0.7;margin-bottom:0.5rem"><a href="%s/" style="color:#fff">Home</a> &rsaquo; <a href="%s/service-area/" style="color:#fff">Service Area</a> &rsaquo; %s</p>
<h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">%s</h1>
<p style="opacity:0.88">Proudly serving %s -- locally owned, not a big-city company driving out. Se Habla Espanol.</p>
</div></div>
<div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem">
<p>%s</p>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Services Available in %s</h2>
<ul><li><a href="%s/services/residential-garage-doors/">Residential Garage Door Repair &amp; Installation</a></li><li><a href="%s/services/commercial-overhead-doors/">Commercial Overhead Doors</a></li><li><a href="%s/services/roll-up-doors/">Roll-Up Doors</a></li><li><a href="%s/services/storefront-doors/">Storefront Doors</a></li><li><a href="%s/services/barn-agricultural-doors/">Barn &amp; Agricultural Doors</a></li><li><a href="%s/services/entry-doors/">Entry Doors</a></li><li><a href="%s/services/dock-equipment/">Dock Equipment</a></li><li><a href="%s/services/window-repair-replacement/">Window Repair &amp; Replacement</a></li></ul>
<div style="text-align:center;margin-top:2.5rem;padding:2rem;background:#F8F6F2;border-radius:8px">
<h3 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem">Ready to Schedule Service in %s?</h3>
<p>Call (806) 316-5296 or get a free estimate online. Se Habla Espanol.</p>
<a href="tel:+18063165296" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">(806) 316-5296</a>
<a href="%s/estimate/" style="background:#1B3A5C;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block;margin:0.3rem">Get Free Estimate</a>
</div></div>""" % (city, city, BASE, BASE, city, title, angle, description, city,
                   BASE, BASE, BASE, BASE, BASE, BASE, BASE, BASE,
                   city, BASE)
        if sa_id:
            create_page(title, slug, content, parent_id=sa_id)
        else:
            create_page(title, slug, content)

    # 10. Commercial hub
    print("=== Commercial Hub ===")
    commercial_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Commercial Door Services -- Texas Panhandle</h1><p style="opacity:0.88">Dimitroff Door Repair is the Texas Panhandle's leading commercial door company for overhead doors, roll-up doors, storefront doors, dock equipment, and commercial windows.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Commercial door failures cost your business money. Dimitroff Door Repair provides fast, professional commercial door service for warehouses, distribution centers, retail, auto shops, agricultural operations, and industrial facilities throughout the Texas Panhandle and NE New Mexico.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Commercial Door Services</h2><ul><li><a href="%s/services/commercial-overhead-doors/">Commercial Overhead Doors</a> -- heavy sectional steel, high-speed doors</li><li><a href="%s/services/roll-up-doors/">Roll-Up Doors</a> -- coiling doors for storage units, shops, industrial bays</li><li><a href="%s/services/storefront-doors/">Storefront Doors</a> -- aluminum framed glass doors for retail and office</li><li><a href="%s/services/dock-equipment/">Dock Equipment</a> -- levelers, seals, bumpers, dock doors</li><li><a href="%s/services/window-repair-replacement/">Commercial Window Repair</a> -- glass replacement, re-glazing</li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Commercial Estimate</a></div></div>""" % tuple([BASE] * 6)
    create_page("Commercial Door Services", "commercial", commercial_content)

    # 11. Residential hub
    print("=== Residential Hub ===")
    residential_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Residential Door Services -- Texas Panhandle</h1><p style="opacity:0.88">Garage door repair and installation, entry doors, and window replacement for homeowners throughout the Texas Panhandle.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Dimitroff Door Repair keeps Panhandle homeowners' doors working. We provide same-day garage door repair, new garage door installation, entry door service, and window repair for residents in Dumas, Amarillo, Pampa, Canyon, and every community in the region.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">Residential Door Services</h2><ul><li><a href="%s/services/residential-garage-doors/">Garage Door Repair &amp; Installation</a></li><li><a href="%s/services/entry-doors/">Entry Door Installation &amp; Repair</a></li><li><a href="%s/services/window-repair-replacement/">Window Repair &amp; Replacement</a></li></ul><div style="text-align:center;margin-top:2rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Residential Estimate</a></div></div>""" % tuple([BASE] * 4)
    create_page("Residential Door Services", "residential", residential_content)

    # 12. Blog post
    print("=== Blog Post ===")
    blog_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:900px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">How to Choose a Commercial Overhead Door for Texas Businesses</h1><p style="opacity:0.88">A practical guide from Dimitroff Door Repair, serving the Texas Panhandle since 2010.</p></div></div><div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem"><p>Choosing the right commercial overhead door for your Texas Panhandle business involves more than picking the biggest door at the best price. The harsh West Texas climate, wind loads, and specific operational requirements of your facility all play a role in making the right selection. This guide covers the key factors every Texas business owner should consider.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">1. Understand Your Operational Requirements</h2><p>The first question is how often the door will cycle. A warehouse door opening once or twice a day has very different requirements than a busy distribution center door that cycles dozens of times per hour. High-frequency applications require high-cycle springs and heavy-duty tracks rated for 100,000 cycles or more.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">2. Wind Load Ratings Matter in the Texas Panhandle</h2><p>The Texas Panhandle is one of the windiest regions in the United States. Wind load ratings on commercial overhead doors are not optional here -- they are essential. Look for doors tested to local building codes and designed to handle sustained winds common in Moore County, Potter County, and surrounding Panhandle communities.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">3. Insulation and Energy Efficiency</h2><p>Insulated commercial overhead doors are worth the investment in Texas, where summer temperatures regularly exceed 100 degrees. A well-insulated door reduces HVAC load in conditioned spaces, keeps refrigerated goods at temperature, and lowers energy bills year-round.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">4. Steel Gauge and Door Construction</h2><p>Commercial overhead doors come in different steel gauges. Heavier gauge steel (lower number) means more durability but higher cost. For most Panhandle commercial applications, 24-gauge steel provides a good balance of strength and economy. For high-impact industrial environments -- auto shops, feedlots, oil field buildings -- consider heavier gauge or specialty doors.</p><h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.8rem;margin:2rem 0 1rem">5. Professional Installation Is Essential</h2><p>A commercial overhead door is only as good as its installation. Improper spring tension, mis-aligned tracks, or incorrect opener selection lead to premature failure and safety hazards. Dimitroff Door Repair provides professional commercial door installation throughout the Texas Panhandle and NE New Mexico, with 90-day warranty on every job.</p><div style="text-align:center;margin-top:2.5rem;padding:2rem;background:#F8F6F2;border-radius:8px"><h3 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem">Ready for a Commercial Door Consultation?</h3><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;display:inline-block">Get Free Estimate</a></div></div>""" % BASE
    wp(["post", "create",
        "--post_type=post",
        "--post_status=publish",
        "--post_title=How to Choose a Commercial Overhead Door for Texas Businesses",
        "--post_name=commercial-overhead-door-guide",
        "--post_content=" + blog_content,
        "--porcelain"])

    # 13. Estimate page
    print("=== Estimate Page ===")
    # Create CF7 form first
    r = subprocess.run(
        ["docker", "exec", CONTAINER, "wp", "cf7", "create",
         "--title=Estimate Request",
         "--allow-root"],
        capture_output=True, text=True
    )
    form_id = r.stdout.strip()
    if not form_id or not form_id.isdigit():
        form_id = "1"
    estimate_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:700px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Get a Free Estimate</h1><p style="opacity:0.88">Fill out the form below and we will contact you within 1 business hour to confirm your appointment. Se Habla Espanol. Call us directly at (806) 316-5296.</p></div></div>
<div class="estimate-section">
<p class="sub">No obligation. No surprise fees. We give you a clear estimate before any work begins.</p>
<form method="post" style="background:#fff;padding:2rem;border-radius:8px;border:1px solid #DDD8CE">
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Your Name *</label><input type="text" name="your-name" required style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem"></p>
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Phone Number *</label><input type="tel" name="your-phone" required style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem"></p>
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Email Address</label><input type="email" name="your-email" style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem"></p>
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Service Needed *</label>
<select name="service" required style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem">
<option value="">-- Select a Service --</option>
<option>Residential Garage Door Repair</option>
<option>Residential Garage Door Installation</option>
<option>Commercial Overhead Door</option>
<option>Roll-Up Door</option>
<option>Storefront Door</option>
<option>Barn / Agricultural Door</option>
<option>Entry Door</option>
<option>Dock Equipment</option>
<option>Window Repair / Replacement</option>
<option>Other</option>
</select></p>
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Your City / Location *</label><input type="text" name="city" required placeholder="e.g. Dumas TX, Amarillo TX, Borger TX..." style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem"></p>
<p><label style="font-weight:600;display:block;margin-bottom:0.3rem">Tell Us About Your Project</label><textarea name="message" rows="4" style="width:100%;padding:0.75rem;border:1px solid #DDD8CE;border-radius:4px;font-size:0.95rem"></textarea></p>
<p><button type="submit" style="background:#E85D04;color:#fff;padding:0.85rem 2.5rem;border:none;border-radius:4px;font-size:1rem;font-weight:600;cursor:pointer">Send Estimate Request</button></p>
</form></div>"""
    create_page("Get a Free Estimate", "estimate", estimate_content)

    # 14. Contact page
    print("=== Contact Page ===")
    contact_content = """<div style="background:#1B3A5C;color:#fff;padding:3rem 1.5rem"><div style="max-width:700px;margin:0 auto"><h1 style="font-family:Barlow Condensed,sans-serif;font-size:2.8rem;font-weight:700">Contact Dimitroff Door Repair</h1></div></div>
<div style="max-width:900px;margin:0 auto;padding:3rem 1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:2.5rem">
<div>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem;margin-bottom:1rem">Contact Information</h2>
<p><strong>Phone:</strong> <a href="tel:+18063165296">(806) 316-5296</a></p>
<p style="margin-top:0.75rem"><strong>Address:</strong><br>120 Amherst Avenue<br>Dumas, TX 79029</p>
<p style="margin-top:0.75rem"><strong>Hours:</strong><br>Mon - Fri: 8:00 AM - 6:00 PM<br>Sat - Sun: 10:00 AM - 5:00 PM</p>
<p style="margin-top:0.75rem"><strong>Se Habla Espanol</strong></p>
<p style="margin-top:1.5rem"><a href="%s/estimate/" style="background:#E85D04;color:#fff;padding:0.8rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Get Free Estimate</a></p>
</div>
<div>
<h2 style="font-family:Barlow Condensed,sans-serif;color:#1B3A5C;font-size:1.5rem;margin-bottom:1rem">Service Area</h2>
<p>We serve the entire Texas Panhandle including Dumas, Amarillo, Pampa, Borger, Perryton, Dalhart, Hereford, Canyon, and Friona, plus Northeast New Mexico including Clovis, Tucumcari, and Clayton.</p>
<p style="margin-top:1rem"><a href="%s/service-area/">View Full Service Area &rarr;</a></p>
</div>
</div>""" % (BASE, BASE)
    create_page("Contact", "contact", contact_content)

    # 15. Free SEO Audit page
    print("=== SEO Audit Page ===")
    seo_audit_content = "<!-- SEO Audit page rendered by page-seo-audit.php -->"
    create_page("Free SEO Audit", "free-seo-audit", seo_audit_content)
    # Set page template
    r2 = subprocess.run(
        ["docker", "exec", CONTAINER, "wp", "post", "list",
         "--post_type=page", "--post_status=publish",
         "--fields=ID,post_name", "--format=csv", "--allow-root"],
        capture_output=True, text=True
    )
    for line in r2.stdout.splitlines():
        parts = line.split(",")
        if len(parts) >= 2 and parts[1].strip() == "free-seo-audit":
            wp(["post", "meta", "update", parts[0].strip(), "_wp_page_template", "page-seo-audit.php"])

    # 16. Yoast homepage meta
    print("=== Yoast Meta ===")
    wp(["post", "meta", "update", "1",
        "_yoast_wpseo_title",
        "Garage Door & Commercial Door Repair -- Texas Panhandle | Dimitroff Door Repair"])
    wp(["post", "meta", "update", "1",
        "_yoast_wpseo_metadesc",
        "Dimitroff Door Repair serves the entire Texas Panhandle and NE New Mexico. Residential garage doors, commercial overhead doors, barn doors, dock equipment, and window repair. Call (806) 316-5296. Se Habla Espanol."])

    # 17. Rewrite flush
    print("=== Rewrite Flush ===")
    wp(["rewrite", "flush", "--hard"])

    print("")
    print("=== SEED COMPLETE ===")
    print("Admin: %s/wp-admin/" % BASE)
    print("User: admin / DimitroffAdmin2026!")
    print("Homepage: %s/" % BASE)
    print("Services: %s/services/" % BASE)
    print("SEO Audit: %s/free-seo-audit/" % BASE)


if __name__ == "__main__":
    main()
