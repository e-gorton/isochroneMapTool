// Prime QGIS symbology converted for web use.
// Source: attached QGIS style XML, Prime-tagged symbols including Facilities and Employment Areas.
// QGIS local SVG paths are retained as references only; webIcon/markerShape are browser-safe fallbacks.
(() => {
  const categories = [
    {
      id: 'railway_station',
      primeCategory: 'Transport - Train Station',
      primeSymbolName: 'Transport - Train Station',
      qgisSvg: 'transport/transport_train_station2.svg',
      colour: '#e31a1c',
      outlineColour: '#232323',
      webIcon: 'train',
      markerShape: 'diamond',
      legendLabel: 'Railway station',
      featureType: 'point',
      osm: [{ railway: ['station', 'halt'] }, { public_transport: ['station'], train: ['yes'] }],
      nameFallback: ['railway station', 'train station']
    },
    {
      id: 'community_centre',
      primeCategory: 'Facilities - Community Centre',
      primeSymbolName: 'Facilities - Community Centre',
      qgisSvg: "UNOCHA Humanitarian Icons 2018 (Dale Kunce's Repository at the American Red Cross)/svg/Partnership.svg",
      colour: '#33a02c',
      outlineColour: '#418600',
      webIcon: 'users',
      markerShape: 'hex',
      legendLabel: 'Community centre',
      featureType: 'point',
      osm: [{ amenity: ['community_centre', 'library', 'townhall', 'village_hall', 'social_facility'] }],
      nameFallback: ['community centre', 'village hall', 'civic hall', 'library']
    },
    {
      id: 'bank_atm',
      primeCategory: 'Facilities - Bank / ATM',
      primeSymbolName: 'Facilities - Bank / ATM',
      qgisSvg: 'landmark/tourism=museum.svg',
      colour: '#ff7f00',
      outlineColour: '#ff7f00',
      webIcon: 'landmark',
      markerShape: 'square',
      legendLabel: 'Bank / ATM',
      featureType: 'point',
      osm: [{ amenity: ['bank', 'atm'] }],
      preferTags: { primary: { amenity: 'bank' }, fallback: { amenity: 'atm' } },
      nameFallback: ['bank', 'atm', 'cashpoint', 'cash point']
    },
    {
      id: 'education',
      primeCategory: 'Facilities - Education',
      primeSymbolName: 'Facilities - Education',
      qgisSvg: "UNOCHA Humanitarian Icons 2018 (Dale Kunce's Repository at the American Red Cross)/svg/Education.svg",
      colour: '#1f78b4',
      outlineColour: '#232323',
      webIcon: 'graduation-cap',
      markerShape: 'triangle',
      legendLabel: 'Education',
      featureType: 'point',
      osm: [{ amenity: ['school', 'college', 'university', 'kindergarten'] }, { building: ['school', 'college', 'university'] }],
      nameFallback: ['school', 'academy', 'college', 'university', 'primary', 'secondary']
    },
    {
      id: 'medical_facility',
      primeCategory: 'Facilities - Medical Facility',
      primeSymbolName: 'Facilities - Medical Facility',
      qgisSvg: "UNOCHA Humanitarian Icons 2018 (Dale Kunce's Repository at the American Red Cross)/svg/Medical-supply.svg",
      colour: '#e31a1c',
      outlineColour: '#e31a1c',
      webIcon: 'cross',
      markerShape: 'cross',
      legendLabel: 'Medical facility',
      featureType: 'point',
      osm: [{ amenity: ['doctors', 'clinic', 'dentist', 'hospital'] }, { healthcare: ['doctor', 'clinic', 'dentist', 'hospital', 'yes'] }],
      nameFallback: ['gp', 'doctor', 'surgery', 'clinic', 'dentist', 'dental', 'hospital', 'health centre']
    },
    {
      id: 'pharmacy',
      primeCategory: 'Facilities - Pharmacy',
      primeSymbolName: 'Facilities - Pharmacy',
      qgisSvg: 'services/amenity=pharmacy.svg',
      colour: '#33a02c',
      outlineColour: '#33a02c',
      webIcon: 'prescription-bottle-medical',
      markerShape: 'cross',
      legendLabel: 'Pharmacy',
      featureType: 'point',
      osm: [{ amenity: ['pharmacy'] }, { shop: ['chemist'] }],
      nameFallback: ['pharmacy', 'chemist']
    },
    {
      id: 'place_of_worship',
      primeCategory: 'Facilities - Place of Worship',
      primeSymbolName: 'Facilities - Place of Worship',
      qgisSvg: 'landmark/amenity=place_of_worship.svg',
      colour: '#866ccc',
      outlineColour: '#866ccc',
      webIcon: 'place-of-worship',
      markerShape: 'pentagon',
      legendLabel: 'Place of worship',
      featureType: 'point',
      osm: [{ amenity: ['place_of_worship'] }, { religion: ['christian', 'muslim', 'jewish'] }],
      nameFallback: ['church', 'mosque', 'masjid', 'synagogue', 'temple', 'chapel']
    },
    {
      id: 'post_office',
      primeCategory: 'Facilities - Post Office',
      primeSymbolName: 'Facilities - Post Office',
      qgisSvg: "UNOCHA Humanitarian Icons 2018 (Dale Kunce's Repository at the American Red Cross)/svg/E-mail.svg",
      colour: '#2f40ff',
      outlineColour: '#232323',
      webIcon: 'mailbox',
      markerShape: 'square',
      legendLabel: 'Post office',
      featureType: 'point',
      osm: [{ amenity: ['post_office', 'post_box'] }],
      preferTags: { primary: { amenity: 'post_office' }, fallback: { amenity: 'post_box' } },
      nameFallback: ['post office', 'post box', 'letter box']
    },
    {
      id: 'public_house',
      primeCategory: 'Facilities - Public House',
      primeSymbolName: 'Facilities - Public House',
      qgisSvg: 'entertainment/amenity=cafe.svg',
      colour: '#cc1ef7',
      outlineColour: '#232323',
      webIcon: 'beer-mug-empty',
      markerShape: 'star',
      legendLabel: 'Public house',
      featureType: 'point',
      osm: [{ amenity: ['pub', 'bar'] }],
      nameFallback: ['pub', 'public house', 'bar', ' inn']
    },
    {
      id: 'recreation',
      primeCategory: 'Facilities - Recreation',
      primeSymbolName: 'Facilities - Recreation',
      qgisSvg: 'sport/sport_gym.svg',
      colour: '#418600',
      outlineColour: '#418600',
      webIcon: 'dumbbell',
      markerShape: 'ring',
      legendLabel: 'Recreation',
      featureType: 'point',
      osm: [{ leisure: ['fitness_centre', 'sports_centre', 'recreation_ground', 'pitch', 'swimming_pool'] }, { sport: ['*'] }],
      nameFallback: ['gym', 'fitness', 'sports centre', 'leisure centre', 'recreation ground', 'swimming']
    },
    {
      id: 'retail',
      primeCategory: 'Facilities - Retail',
      primeSymbolName: 'Facilities - Retail',
      qgisSvg: 'shopping/shopping_supermarket.svg',
      colour: '#ff7f00',
      outlineColour: '#ff7f00',
      webIcon: 'shopping-basket',
      markerShape: 'circle',
      legendLabel: 'Retail',
      featureType: 'point',
      osm: [{ shop: ['supermarket', 'convenience', 'mall', 'department_store'] }, { amenity: ['marketplace'] }],
      preferTags: { primary: { shop: 'supermarket' }, fallback: { shop: 'convenience' } },
      nameFallback: ['supermarket', 'convenience', 'tesco', 'sainsbury', 'asda', 'morrisons', 'aldi', 'lidl', 'waitrose', 'co-op', 'coop', 'spar', 'nisa']
    },
    {
      id: 'employment_areas',
      primeCategory: 'Employment Areas',
      primeSymbolName: 'Employment Areas',
      qgisSvg: null,
      colour: '#866ccc',
      outlineColour: '#4e3f76',
      webIcon: 'building-2',
      markerShape: 'square',
      legendLabel: 'Employment areas',
      featureType: 'polygon',
      osm: [{ landuse: ['industrial', 'commercial', 'retail'] }, { office: ['*'] }, { industrial: ['*'] }, { building: ['industrial', 'commercial', 'office', 'warehouse'] }],
      nameFallback: ['industrial estate', 'business park', 'employment area', 'office park', 'commercial estate', 'warehouse']
    }
  ];

  window.PRIME_SYMBOLOGY = {
    source: 'Prime QGIS style XML converted to web mapping config',
    categories,
    categoryNames: categories.map((item) => item.primeCategory)
  };
})();
