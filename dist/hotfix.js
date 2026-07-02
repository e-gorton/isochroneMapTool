(function () {
  window.projectCoordinateToLocalMetres = function projectCoordinateToLocalMetres(coordinate, origin) {
    const metresPerDegreeLatitude = 111320;
    const metresPerDegreeLongitude = 111320 * Math.max(Math.cos((Number(origin.latitude) * Math.PI) / 180), 0.2);
    return {
      x: (Number(coordinate.longitude) - Number(origin.longitude)) * metresPerDegreeLongitude,
      y: (Number(coordinate.latitude) - Number(origin.latitude)) * metresPerDegreeLatitude,
    };
  };

  function moveManualControls() {
    const rail = document.querySelector('.control-rail');
    const manualPanel = document.querySelector('.manual-edit-panel');
    const advancedPanel = document.querySelector('.advanced-panel');
    if (rail && manualPanel && manualPanel.parentElement !== rail) {
      rail.insertBefore(manualPanel, advancedPanel || null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', moveManualControls, { once: true });
  } else {
    moveManualControls();
  }
})();
