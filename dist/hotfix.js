(function () {
  window.projectCoordinateToLocalMetres = function projectCoordinateToLocalMetres(coordinate, origin) {
    const metresPerDegreeLatitude = 111320;
    const metresPerDegreeLongitude = 111320 * Math.max(Math.cos((Number(origin.latitude) * Math.PI) / 180), 0.2);
    return {
      x: (Number(coordinate.longitude) - Number(origin.longitude)) * metresPerDegreeLongitude,
      y: (Number(coordinate.latitude) - Number(origin.latitude)) * metresPerDegreeLatitude,
    };
  };

  function rebuildReferenceLayout() {
    const rail = document.querySelector('.control-rail');
    const toolbar = document.querySelector('.workspace-toolbar');
    const advancedPanel = document.querySelector('.advanced-panel');
    const manualPanel = document.querySelector('.manual-edit-panel');
    const editor = document.querySelector('.editor-stage');
    const outputs = document.querySelector('.outputs-stage');
    const mainStage = document.querySelector('.main-stage');
    if (!rail || !mainStage) return;

    let actions = document.querySelector('.toolbar-block-actions');
    let mode = document.querySelector('.toolbar-block-mode');
    let exports = document.querySelector('.toolbar-block-export');
    let status = document.querySelector('.toolbar-block-status');
    if (toolbar) {
      actions = actions || toolbar.querySelector('.toolbar-block-actions');
      mode = mode || toolbar.querySelector('.toolbar-block-mode');
      exports = exports || toolbar.querySelector('.toolbar-block-export');
      status = status || toolbar.querySelector('.toolbar-block-status');
    }

    const insertAfter = (node, reference) => {
      if (!node || !reference || reference.parentElement !== rail) return;
      rail.insertBefore(node, reference.nextSibling);
    };

    if (advancedPanel && advancedPanel.parentElement === rail) {
      insertAfter(actions, advancedPanel);
      insertAfter(mode, actions || advancedPanel);
    } else {
      if (actions) rail.appendChild(actions);
      if (mode) rail.appendChild(mode);
    }

    if (editor && editor.parentElement === rail) {
      editor.querySelectorAll('.list-panel').forEach((list) => rail.appendChild(list));
    }
    if (manualPanel) rail.appendChild(manualPanel);
    if (exports) rail.appendChild(exports);
    if (outputs && outputs.parentElement === rail) rail.appendChild(outputs);
    if (status) rail.appendChild(status);
    if (toolbar) toolbar.remove();

    let bottomPanels = document.querySelector('.bottom-panels');
    if (!bottomPanels) {
      bottomPanels = document.createElement('section');
      bottomPanels.className = 'bottom-panels';
      bottomPanels.setAttribute('aria-label', 'Amenity, manual edit and method note panels');
      mainStage.appendChild(bottomPanels);
    }
    if (editor) bottomPanels.appendChild(editor);
    if (outputs) bottomPanels.appendChild(outputs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rebuildReferenceLayout, { once: true });
  } else {
    rebuildReferenceLayout();
  }
  window.addEventListener('load', rebuildReferenceLayout, { once: true });
})();
