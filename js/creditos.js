/* creditos.js — Créditos de las imágenes (generado a partir del archivo de imágenes de la NASA).
   Si cambias una imagen, actualiza también CREDITOS.md. */
const CREDITOS_IMAGENES = [
    {
        "archivo":  "cohete-electron.jpg",
        "titulo":  "CAPSTONE launch (cohete Electron, Rocket Lab)",
        "autor":  "Yourong F. Wang, vía Wikimedia Commons",
        "fecha":  "2022-06-28",
        "id":  "File:CAPSTONE-LAUNCH.jpg",
        "url":  "https://commons.wikimedia.org/wiki/File:CAPSTONE-LAUNCH.jpg",
        "licencia":  "CC BY-SA 4.0 (libre con atribución)"
    },
    {
        "archivo":  "cohete-pslv.jpg",
        "titulo":  "PSLV-C59, PROBA-3: lanzamiento",
        "autor":  "Indian Space Research Organisation (ISRO), vía Wikimedia Commons",
        "fecha":  "2024-12-05",
        "id":  "File:PSLV-C59, PROBA-3 - Post-launch images 03.jpg",
        "url":  "https://commons.wikimedia.org/wiki/File:PSLV-C59,_PROBA-3_-_Post-launch_images_03.jpg",
        "licencia":  "GODL-India (licencia abierta del Gobierno de la India, con atribución)"
    },
    {
        "archivo":  "cohete-falcon9.jpg",
        "titulo":  "NASA\u0027s SpaceX Crew-8 Launch",
        "autor":  "NASA/Aubrey Gemignani",
        "fecha":  "2024-03-03",
        "id":  "NHQ202403030015",
        "url":  "https://images.nasa.gov/details/NHQ202403030015",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "cohete-falconheavy.jpg",
        "titulo":  "Psyche on the Launch Pad",
        "autor":  "NASA/Aubrey Gemignani",
        "fecha":  "2023-10-11",
        "id":  "NHQ202310110006",
        "url":  "https://images.nasa.gov/details/NHQ202310110006",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "cohete-rideshare.jpg",
        "titulo":  "DART Prelaunch",
        "autor":  "NASA/Bill Ingalls",
        "fecha":  "2021-11-23",
        "id":  "NHQ202111230019",
        "url":  "https://images.nasa.gov/details/NHQ202111230019",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-antena.jpg",
        "titulo":  "Dawn Spacecraft After Installation of High Gain Antenna",
        "autor":  "NASA/JPL",
        "fecha":  "2009-05-29",
        "id":  "PIA12024",
        "url":  "https://images.nasa.gov/details/PIA12024",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-bateria.jpg",
        "titulo":  "iss061e001616",
        "autor":  "NASA (JSC)",
        "fecha":  "2019-10-06",
        "id":  "iss061e001616",
        "url":  "https://images.nasa.gov/details/iss061e001616",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-computador.jpg",
        "titulo":  "EMIT\u0027s Components Come Together at JPL",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2022-05-02",
        "id":  "PIA25146",
        "url":  "https://images.nasa.gov/details/PIA25146",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-estructura.jpg",
        "titulo":  "GEDI Integration",
        "autor":  "Barbara Lambert",
        "fecha":  "2018-04-24",
        "id":  "GSFC_20180424_GEDI_06209",
        "url":  "https://images.nasa.gov/details/GSFC_20180424_GEDI_06209",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-orientacion.jpg",
        "titulo":  "Star Trackers for Europa Clipper",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2025-02-04",
        "id":  "PIA26562",
        "url":  "https://images.nasa.gov/details/PIA26562",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-paneles.jpg",
        "titulo":  "ROSA deploy",
        "autor":  "Jack Fischer",
        "fecha":  "2017-06-18",
        "id":  "iss052e004379",
        "url":  "https://images.nasa.gov/details/iss052e004379",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "comp-propulsion.jpg",
        "titulo":  "Deep Space 1 Ion Engine",
        "autor":  "NASA/JPL",
        "fecha":  "2002-12-21",
        "id":  "PIA04238",
        "url":  "https://images.nasa.gov/details/PIA04238",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "escenario-apofis.jpg",
        "titulo":  "NASA\u0027s DART at the Didymos System",
        "autor":  "NASA/Johns Hopkins APL/Steve Gribben",
        "fecha":  "2022-09-22",
        "id":  "PIA25329",
        "url":  "https://images.nasa.gov/details/PIA25329",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "escenario-chile.jpg",
        "titulo":  "Earth Observations taken by Expedition 38 crewmember",
        "autor":  "NASA (JSC)",
        "fecha":  "2014-02-14",
        "id":  "iss038e047324",
        "url":  "https://images.nasa.gov/details/iss038e047324",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "escenario-incendios.jpg",
        "titulo":  "Calbuco Volcano Erupts in Southern Chile",
        "autor":  "NOAA/NASA/NPP/VIIRS",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e000740",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e000740",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "escenario-luna.jpg",
        "titulo":  "Apollo 8 Mission image, Earth over the horizon of the moon",
        "autor":  "NASA (JSC)",
        "fecha":  "1968-12-24",
        "id":  "as08-14-2383",
        "url":  "https://images.nasa.gov/details/as08-14-2383",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "escenario-marte.jpg",
        "titulo":  "Hubble Sharpest View Of Mars",
        "autor":  "NASA/JPL",
        "fecha":  "1998-05-02",
        "id":  "PIA01249",
        "url":  "https://images.nasa.gov/details/PIA01249",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-antena.jpg",
        "titulo":  "Tracks of a Giant",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2010-08-25",
        "id":  "PIA13277",
        "url":  "https://images.nasa.gov/details/PIA13277",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-basura.jpg",
        "titulo":  "STS-125 Orbital Debris",
        "autor":  "NASA or National Aeronautics and Space Administration",
        "fecha":  "2009-07-02",
        "id":  "jsc2010e054445",
        "url":  "https://images.nasa.gov/details/jsc2010e054445",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-conjuncion.jpg",
        "titulo":  "Geometry of Mars Solar Conjunction",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2013-03-20",
        "id":  "PIA16811",
        "url":  "https://images.nasa.gov/details/PIA16811",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-eclipseLunar.jpg",
        "titulo":  "Total Lunar Eclipse",
        "autor":  "NASA/Joel Kowsky",
        "fecha":  "2022-11-08",
        "id":  "NHQ202211080005",
        "url":  "https://images.nasa.gov/details/NHQ202211080005",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-erupcion.jpg",
        "titulo":  "NASA Spacecraft Views Erupting Chilean Volcano",
        "autor":  "NASA/GSFC/METI/ERSDAC/JAROS, and U.S./Japan ASTER Science Team",
        "fecha":  "2015-03-13",
        "id":  "PIA19241",
        "url":  "https://images.nasa.gov/details/PIA19241",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "evento-incendio.jpg",
        "titulo":  "A wildfire in Canada and its smoke spreading in the atmosphere",
        "autor":  "NASA (JSC)",
        "fecha":  "2024-08-06",
        "id":  "iss071e439719",
        "url":  "https://images.nasa.gov/details/iss071e439719",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-mascons.jpg",
        "titulo":  "GRAIL Bouguer Gravity Moon Map",
        "autor":  "NASA/JPL-Caltech/MIT/GSFC",
        "fecha":  "2012-12-05",
        "id":  "PIA16623",
        "url":  "https://images.nasa.gov/details/PIA16623",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-particulas.jpg",
        "titulo":  "Asteroid Bennu\u0027s Particle Ejection Events",
        "autor":  "M. Brozovic/NASA/JPL-Caltech/University of Arizona",
        "fecha":  "2020-09-09",
        "id":  "PIA24101",
        "url":  "https://images.nasa.gov/details/PIA24101",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "evento-polvoMarte.jpg",
        "titulo":  "Dust Storm Covers Opportunity",
        "autor":  "NASA/JPL-Caltech/MSSS",
        "fecha":  "2018-06-10",
        "id":  "PIA22329",
        "url":  "https://images.nasa.gov/details/PIA22329",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "evento-rueda.jpg",
        "titulo":  "NASA\u0027s Europa Clipper Reaction Wheels Installed",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2022-11-23",
        "id":  "PIA25495",
        "url":  "https://images.nasa.gov/details/PIA25495",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "evento-tormenta.jpg",
        "titulo":  "NASA\u0027s SDO Shows Images of Significant Solar Flare",
        "autor":  "NASA/SDO",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e001210",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e001210",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "fondo-tierra.jpg",
        "titulo":  "Most Amazing High Definition Image of Earth - Blue Marble 2012",
        "autor":  "NASA/NOAA/GSFC/Suomi NPP/VIIRS/Norman Kuring",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e001386",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e001386",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-apofis-cubesat.jpg",
        "titulo":  "NanoRacks CubeSat Deployment",
        "autor":  "NASA (JSC)",
        "fecha":  "2014-02-13",
        "id":  "iss038e046579",
        "url":  "https://images.nasa.gov/details/iss038e046579",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-apofis-espectro.jpg",
        "titulo":  "BENNU\u0027S JOURNEY",
        "autor":  "NASA (GSFC)",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e000893",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e000893",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-apofis-radar.jpg",
        "titulo":  "Radar Observations of Asteroid 99942 Apophis",
        "autor":  "NASA/JPL-Caltech and NSF/AUI/GBO",
        "fecha":  "2021-03-26",
        "id":  "PIA24168",
        "url":  "https://images.nasa.gov/details/PIA24168",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "inst-chile-espectrometro.jpg",
        "titulo":  "NASA\u0027s EMIT Generates Image Cube of Surface Minerals in Northwest Nevada",
        "autor":  "NASA/JPL-Caltech/USGS",
        "fecha":  "2022-10-12",
        "id":  "PIA25427",
        "url":  "https://images.nasa.gov/details/PIA25427",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-chile-optica.jpg",
        "titulo":  "Landsat View: Santiago, Chile",
        "autor":  "NASA (GSFC)",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e001702",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e001702",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-chile-radar.jpg",
        "titulo":  "NISAR Satellite in Earth Orbit (Artist\u0027s Concept)",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2024-02-20",
        "id":  "PIA26285",
        "url":  "https://images.nasa.gov/details/PIA26285",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-chile-temperatura.jpg",
        "titulo":  "NanoRacks CubeSat Deployment",
        "autor":  "Jack Fischer",
        "fecha":  "2017-05-26",
        "id":  "iss051e049985",
        "url":  "https://images.nasa.gov/details/iss051e049985",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-chile-termica.jpg",
        "titulo":  "NASA\u0027s ECOSTRESS Maps Europe Heat Wave",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2019-07-02",
        "id":  "PIA23148",
        "url":  "https://images.nasa.gov/details/PIA23148",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-incendios-espacial.jpg",
        "titulo":  "NASA\u0027s SDO Sees Solar Flares",
        "autor":  "NASA/SDO/Goddard/Wiessinger",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e001057",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e001057",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-incendios-fuego.jpg",
        "titulo":  "NASA\u0027s ECOSTRESS Images California Wildfires From Space",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2020-10-02",
        "id":  "PIA23721",
        "url":  "https://images.nasa.gov/details/PIA23721",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-incendios-imagenes.jpg",
        "titulo":  "Satellite Eyes First Major Atlantic Hurricane in 3 Years: Gonzalo",
        "autor":  "NASA/GSFC/Jeff Schmaltz/MODIS Land Rapid Response Team",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e000947",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e000947",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-incendios-rayos.jpg",
        "titulo":  "Lightning illuminates the clouds during a storm off the coast of North Carolina",
        "autor":  "NASA (JSC)",
        "fecha":  "2025-05-15",
        "id":  "iss073e0080625",
        "url":  "https://images.nasa.gov/details/iss073e0080625",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-incendios-sonda.jpg",
        "titulo":  "Smoke from Fires in Southwestern Oregon, Northern California",
        "autor":  "NASA Goddard\u0027s MODIS Rapid Response Team, Jeff Schmaltz",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e000674",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e000674",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-luna-camara.jpg",
        "titulo":  "The Fractured Floor of Compton",
        "autor":  "NASA/GSFC/Arizona State University",
        "fecha":  "2009-07-10",
        "id":  "PIA12887",
        "url":  "https://images.nasa.gov/details/PIA12887",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "inst-luna-neutrones.jpg",
        "titulo":  "KSC-2009-2989",
        "autor":  "NASA/Jack Pfaller",
        "fecha":  "2009-05-08",
        "id":  "KSC-2009-2989",
        "url":  "https://images.nasa.gov/details/KSC-2009-2989",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-luna-radar.jpg",
        "titulo":  "KSC-2009-3748",
        "autor":  "NASA/Jack Pfaller",
        "fecha":  "2009-06-17",
        "id":  "KSC-2009-3748",
        "url":  "https://images.nasa.gov/details/KSC-2009-3748",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-luna-shadowcam.jpg",
        "titulo":  "KSC-2009-2990",
        "autor":  "NASA/Jack Pfaller",
        "fecha":  "2009-05-08",
        "id":  "KSC-2009-2990",
        "url":  "https://images.nasa.gov/details/KSC-2009-2990",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-luna-termico.jpg",
        "titulo":  "KSC-2009-2991",
        "autor":  "NASA/Jack Pfaller",
        "fecha":  "2009-05-08",
        "id":  "KSC-2009-2991",
        "url":  "https://images.nasa.gov/details/KSC-2009-2991",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-marte-atmosfera.jpg",
        "titulo":  "Artist Concept of MAVEN Imaging Ultraviolet Spectrograph at Work",
        "autor":  "NASA/Univ. of Colorado",
        "fecha":  "2014-11-07",
        "id":  "PIA18856",
        "url":  "https://images.nasa.gov/details/PIA18856",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "inst-marte-camara.jpg",
        "titulo":  "First Color HiRISE Image of Mars",
        "autor":  "NASA/JPL/University of Arizona",
        "fecha":  "2006-04-07",
        "id":  "PIA08061",
        "url":  "https://images.nasa.gov/details/PIA08061",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "inst-marte-clima.jpg",
        "titulo":  "Mars Climate Sounder Studies 2018 Dust Storm",
        "autor":  "NASA/JPL-Caltech",
        "fecha":  "2018-10-30",
        "id":  "PIA22737",
        "url":  "https://images.nasa.gov/details/PIA22737",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "inst-marte-minerales.jpg",
        "titulo":  "CRISM Global Mapping of Mars, Part 3",
        "autor":  "NASA/JPL/JHUAPL/Applied Coherent Technology",
        "fecha":  "2007-12-12",
        "id":  "PIA10203",
        "url":  "https://images.nasa.gov/details/PIA10203",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "inst-marte-radar.jpg",
        "titulo":  "Glorious Glacier",
        "autor":  "NASA/JPL-Caltech/Univ. of Arizona",
        "fecha":  "2016-07-15",
        "id":  "PIA20745",
        "url":  "https://images.nasa.gov/details/PIA20745",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "orbita-apollo.jpg",
        "titulo":  "View of the Apollo 15 Command/Service Module in lunar orbit",
        "autor":  "NASA (JSC)",
        "fecha":  "1971-07-30",
        "id":  "as15-88-11974",
        "url":  "https://images.nasa.gov/details/as15-88-11974",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-areo.jpg",
        "titulo":  "A Closer Hubble Encounter With Mars - Tharsis",
        "autor":  "Steve Lee University of Colorado, Jim Bell Cornell University, Mike Wolff Space Science Institute, and NASA",
        "fecha":  "1999-08-23",
        "id":  "PIA01590",
        "url":  "https://images.nasa.gov/details/PIA01590",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "orbita-cercana.jpg",
        "titulo":  "A Region of Bennu\u0027s Northern Hemisphere Close Up",
        "autor":  "NASA/Goddard/University of Arizona",
        "fecha":  "2019-03-14",
        "id":  "2019-02-25_regolith_image_compilation",
        "url":  "https://images.nasa.gov/details/2019-02-25_regolith_image_compilation",
        "licencia":  "NASA y colaboradores: uso educativo permitido con atribución"
    },
    {
        "archivo":  "orbita-distante.jpg",
        "titulo":  "BENNU\u0027S JOURNEY",
        "autor":  "NASA (GSFC)",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e000894",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e000894",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-gateway.jpg",
        "titulo":  "Gateway Close-up - Orion spacecraft",
        "autor":  "Alberto Bertolin, Bradley Reynolds",
        "fecha":  "2023-08-18",
        "id":  "Gateway Summer Req Images Rev2_9",
        "url":  "https://images.nasa.gov/details/Gateway%20Summer%20Req%20Images%20Rev2_9",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-goes.jpg",
        "titulo":  "GOES 12 Full Disk view March 16, 2010",
        "autor":  "NOAA/NASA GOES Project",
        "fecha":  "2017-12-08",
        "id":  "GSFC_20171208_Archive_e002123",
        "url":  "https://images.nasa.gov/details/GSFC_20171208_Archive_e002123",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-iss.jpg",
        "titulo":  "The space station orbits above a partly cloudy Pacific Ocean",
        "autor":  "NASA (JSC)",
        "fecha":  "2023-04-17",
        "id":  "iss069e003960",
        "url":  "https://images.nasa.gov/details/iss069e003960",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-landsat.jpg",
        "titulo":  "Retreat of Greenland\u0027s Jakobshavn Isbrae Glacier",
        "autor":  "NASA/USGS",
        "fecha":  "2024-01-17",
        "id":  "PIA26117",
        "url":  "https://images.nasa.gov/details/PIA26117",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-lro.jpg",
        "titulo":  "Lunar Reconnaissance Orbiter Artist Concept",
        "autor":  "NASA/GSFC",
        "fecha":  "2008-07-24",
        "id":  "PIA18163",
        "url":  "https://images.nasa.gov/details/PIA18163",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-maven.jpg",
        "titulo":  "MAVEN at Mars Artist Concept",
        "autor":  "NASA (JPL)",
        "fecha":  "2011-11-18",
        "id":  "PIA14761",
        "url":  "https://images.nasa.gov/details/PIA14761",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-mro.jpg",
        "titulo":  "Mars Reconnaissance Orbiter over Pole Artist Concept",
        "autor":  "JPL/NASA",
        "fecha":  "2003-12-10",
        "id":  "PIA04918",
        "url":  "https://images.nasa.gov/details/PIA04918",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "orbita-sobrevuelo.jpg",
        "titulo":  "Lucy Spacecraft Move from WPC to Airlock",
        "autor":  "NASA/Ben Smegelsky",
        "fecha":  "2021-09-29",
        "id":  "KSC-20210929-PH-JBS01_0051",
        "url":  "https://images.nasa.gov/details/KSC-20210929-PH-JBS01_0051",
        "licencia":  "Dominio público (material de la NASA)"
    },
    {
        "archivo":  "tierra-disco.jpg",
        "titulo":  "Earth",
        "autor":  "NASA (JPL)",
        "fecha":  "2012-01-30",
        "id":  "PIA18033",
        "url":  "https://images.nasa.gov/details/PIA18033",
        "licencia":  "Dominio público (material de la NASA)"
    }
];
