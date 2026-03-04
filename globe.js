// globe.js — amCharts 5 rotating globe
//
// amCharts 5 coding rules followed:
//   · Always use .new() factory pattern (never `new ClassName()`)
//   · Colors use am5.color() with hex integers, e.g. am5.color(0xff0000)
//   · Set data LAST — after all template/config is applied (rule #2)
//   · Dark theme included for dark-background pages (rule #28)
//   · Do NOT style chart elements with CSS — use .set() / themes (rule #29)

(function () {
  "use strict";

  // ── 1. Root ────────────────────────────────────────────────────────────────
  var root = am5.Root.new("globeDiv");

  // Animated theme drives entrance animations; Dark theme suits the dark page
  root.setThemes([
    am5themes_Animated.new(root),
    am5themes_Dark.new(root)
  ]);

  // ── 2. MapChart with orthographic (globe) projection ──────────────────────
  var chart = root.container.children.push(
    am5map.MapChart.new(root, {
      panX: "rotateX",      // drag horizontally → rotate longitude COMMENT OUT
      panY: "rotateY",      // drag vertically   → rotate latitude  COMMENT OUT
      projection: am5map.geoOrthographic(),
      wheelX: "none",
      wheelY: "none",
      rotationX: 0,
      rotationY: -20        // slight northward tilt for aesthetics
    })
  );

  // ── 3. Ocean / background fill (depth effect) ──────────────────────────────
  var backgroundSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {})
  );

  backgroundSeries.mapPolygons.template.setAll({
    fill: am5.color(0x0d1526),
    fillOpacity: 0.85,
    strokeOpacity: 0
  });

  // Set data LAST (rule #2): a single rectangle covering the whole globe
  backgroundSeries.data.push({
    geometry: am5map.getGeoRectangle(90, 180, -90, -180)
  });

  // ── 4. Graticule — subtle lat/lon grid overlay ────────────────────────────
  var graticuleSeries = chart.series.push(
    am5map.GraticuleSeries.new(root, {})
  );

  graticuleSeries.mapLines.template.setAll({
    stroke: am5.color(0x7986cb),
    strokeOpacity: 0.12,
    strokeWidth: 0.5
  });

  // ── 5. Country polygons ───────────────────────────────────────────────────
  var polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ["AQ"]       // omit Antarctica
    })
  );

  // Configure template BEFORE data is set (rule #2)
  polygonSeries.mapPolygons.template.setAll({
    tooltipText: "{name}",  // country name tooltip on hover
    toggleKey: "active",    // click toggles the "active" state
    interactive: false,
    fill: am5.color(0xecf0f8),
    stroke: am5.color(0x4a5a90),
    strokeWidth: 0.5,
    fillOpacity: 0.85
  });

  // Hover state
  polygonSeries.mapPolygons.template.states.create("hover", {
    fill: am5.color(0x5c6bc0),
    fillOpacity: 1
  });

  // Selected / active state
  polygonSeries.mapPolygons.template.states.create("active", {
    fill: am5.color(0x9fa8da),
    fillOpacity: 1
  });

  // Single-select: deselect the previously highlighted country on new click
  var previousPolygon = null;

  polygonSeries.mapPolygons.template.events.on("click", function (ev) {
    if (previousPolygon && previousPolygon !== ev.target) {
      previousPolygon.states.applyAnimate("default");
    }
    previousPolygon = ev.target;
  });

  // ── 6. Auto-rotation — 360° / 30 s, infinite loop ────────────────────────
  var rotationAnimation = null;

  function startRotation() {
    // Always animate FROM current longitude so resumed rotation is seamless
    var fromX = chart.get("rotationX") != null ? chart.get("rotationX") : 0;

    rotationAnimation = chart.animate({
      key: "rotationX",
      from: fromX,
      to: fromX + 360,
      duration: 30000,      // 30 seconds per revolution
      loops: Infinity
    });
  }

  // Pause auto-rotation during drag so the user has full control
  chart.events.on("panstarted", function () {
    if (rotationAnimation) {
      rotationAnimation.stop();
      rotationAnimation = null;
    }
  });

  // Resume from the new longitude once dragging ends
  chart.events.on("panended", function () {
    startRotation();
  });

  // ── 7. Slider — adjust globe's horizontal start position ─────────────────
  var globeSlider = document.getElementById("globeSlider");

  if (globeSlider) {
    // While slider is being moved: stop animation and set longitude live
    globeSlider.addEventListener("input", function () {
      if (rotationAnimation) {
        rotationAnimation.stop();
        rotationAnimation = null;
      }
      chart.set("rotationX", parseFloat(this.value));
    });

    // When slider thumb is released: restart auto-rotation from new position
    globeSlider.addEventListener("change", function () {
      startRotation();
    });
  }

  // ── 8. Entrance animation, then kick off rotation ─────────────────────────
  // chart.appear() uses the Animated theme for a smooth fade/scale-in
  chart.appear(1000, 100);
  startRotation();

})();
