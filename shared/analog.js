// Shared behavior for every analogimation. Each page includes this, then calls the pieces it needs:
//   Analog.watchColors(keys, colors)  - copy CSS color tokens into `colors`, and keep them current in dark mode
//   Analog.drawDial(ctx, colors, ...) - round pressure-style gauge drawn on a canvas
//   Analog.showMode({ show, button }) - "Full screen" button, iPad/home-screen launch straight into full screen
//   Analog.fitDiagram({ canvas, stage, hud, width }) - scale controls with a 16:9 diagram, phone rules
// Page structure these expect: see animations/pressure-vessel/src/index.html (.show > .presets, .stage > canvas + .hud, .bar).
window.Analog = (() => {
  function watchColors(keys, colors) {
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      for (const k of keys) colors[k] = s.getPropertyValue('--' + k).trim();
    };
    read();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', read);
    new MutationObserver(read).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return colors;
  }

  // Dial: 270 degree sweep from 0 to opts.max (default 10). opts.numbers labels the ticks; opts.marks puts dots on the rim.
  const A0 = 0.75 * Math.PI, SWEEP = 1.5 * Math.PI;
  function drawDial(ctx, colors, cx, cy, r, value, color, opts = {}) {
    const MAX = opts.max || 10;
    const ang = v => A0 + SWEEP * Math.max(0, Math.min(MAX, v)) / MAX;
    ctx.fillStyle = colors.panel;
    ctx.strokeStyle = colors.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const tr = r - 7;
    ctx.lineCap = 'round';
    ctx.strokeStyle = colors.line; ctx.lineWidth = r > 40 ? 6 : 4;
    ctx.beginPath(); ctx.arc(cx, cy, tr, A0, A0 + SWEEP); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, tr, A0, ang(value)); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.strokeStyle = colors.muted; ctx.lineWidth = 1.2;
    ctx.fillStyle = colors.muted; ctx.font = '500 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let t = 0; t <= MAX; t += MAX / 5) {
      const a = ang(t), c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(cx + c * (tr - 6), cy + s * (tr - 6)); ctx.lineTo(cx + c * (tr - 11), cy + s * (tr - 11)); ctx.stroke();
      if (opts.numbers) ctx.fillText(t, cx + c * (tr - 20), cy + s * (tr - 20));
    }
    for (const m of opts.marks || []) {
      const a = ang(m.v);
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r + 5), cy + Math.sin(a) * (r + 5), m.size || 4, 0, Math.PI * 2); ctx.fill();
    }
    const a = ang(value);
    ctx.strokeStyle = colors.fg; ctx.lineWidth = r > 40 ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (tr - 4), cy + Math.sin(a) * (tr - 4)); ctx.stroke();
    ctx.fillStyle = colors.fg; ctx.beginPath(); ctx.arc(cx, cy, r > 40 ? 5 : 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.fg; ctx.font = (r > 40 ? '500 17px' : '500 12px') + ' "IBM Plex Mono", monospace';
    ctx.fillText(value.toFixed(r > 40 ? 2 : 1), cx, cy + r * (r > 40 ? 0.72 : 0.5));
    ctx.textBaseline = 'alphabetic';
  }

  // Full screen: real Fullscreen API where the browser allows it, otherwise a fixed overlay that fills the window
  function showMode({ show, button }) {
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
    function setShow(on) {
      show.classList.toggle('is-show', on);
      button.textContent = on ? 'Exit full screen' : 'Full screen';
      document.documentElement.style.overflow = on ? 'hidden' : '';
    }
    button.addEventListener('click', async () => {
      if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (show.classList.contains('is-show')) { setShow(false); return; }
      setShow(true);
      const req = show.requestFullscreen || show.webkitRequestFullscreen;
      if (req) { try { await req.call(show); } catch (e) { /* stays in window-filling mode */ } }
    });
    const onFs = () => { if (!fsEl()) setShow(false); };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && show.classList.contains('is-show') && !fsEl()) setShow(false); });
    // Opened from the iPad home screen: start straight in full-screen show mode
    if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) setShow(true);
    return setShow;
  }

  // Scale the control overlay with the diagram; stack it below on narrow screens.
  // Phones (shorter screen side under 600px; iPads are 744px or more) get class "phone", plus "portrait" when upright.
  function fitDiagram({ canvas, stage, hud, width }) {
    const root = document.documentElement;
    function setDevice() {
      const phone = Math.min(innerWidth, innerHeight) < 600;
      root.classList.toggle('phone', phone);
      root.classList.toggle('portrait', phone && innerHeight > innerWidth);
    }
    function fit() {
      setDevice();
      const k = canvas.clientWidth / width;
      const phone = root.classList.contains('phone');
      // On phones the controls stay on the diagram and are enlarged a little so they stay usable
      const stacked = !phone && k < 0.62;
      stage.classList.toggle('stacked', stacked);
      hud.style.transform = stacked ? '' : `scale(${k})`;
      hud.style.setProperty('--boost', phone && !stacked ? Math.min(1.35, Math.max(1, 0.62 / k)).toFixed(3) : 1);
    }
    new ResizeObserver(fit).observe(canvas);
    window.addEventListener('resize', fit);
    fit();
    return fit;
  }

  return { watchColors, drawDial, showMode, fitDiagram };
})();
