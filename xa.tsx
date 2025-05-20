// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Map } from 'react-map-gl/maplibre';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { DeckGL } from '@deck.gl/react';
import { PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { animate } from 'popmotion';

import type { Position, Color, Material, MapViewState } from '@deck.gl/core';

// Source data CSV
const DATA_URL = {
    TRIPS: '/SynMob/trips_xa.json'
};

const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
});

const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 2.0,
    position: [108.90, 34.20, 8000]
});

const lightingEffect = new LightingEffect({ ambientLight, pointLight });

type Theme = {
    trailColor0: Color;
    trailColor1: Color;
    trailColor2: Color;
    trailColor3: Color;
    trailColor4: Color;
    trailColor5: Color;
    trailColor6: Color;
    material: Material;
    effects: [LightingEffect];
};

const DEFAULT_THEME: Theme = {
    trailColor0: [253, 128, 93],  // 红色
    trailColor1: [23, 184, 190],  // 青色
    trailColor2: [255, 215, 0],   // 金色
    trailColor3: [50, 205, 50],   // 绿色
    trailColor4: [147, 112, 219], // 紫色
    trailColor5: [255, 165, 0],   // 橙色
    trailColor6: [0, 191, 255],   // 深天蓝
    material: {
        ambient: 0.1,
        diffuse: 0.6,
        shininess: 32,
        specularColor: [60, 64, 70]
    },
    effects: [lightingEffect]
};

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 108.94,
    latitude: 34.23,
    zoom: 12,
    pitch: 45,
    bearing: 0
};


const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

const landCover: Position[][] = [
    [
        // [104.06, 30.66],
        // [104.04, 30.66],
        // [104.04, 30.68],
        // [104.06, 30.68]
        [108.99, 34.20],
        [108.90, 34.20],
        [108.90, 34.28],
        [108.99, 34.28]
    ]
];


type Trip = {
    vendor: number;
    path: Position[];
    timestamps: number[];
};

export default function App({
    trips = DATA_URL.TRIPS,
    trailLength = 180,
    initialViewState = INITIAL_VIEW_STATE,
    mapStyle = MAP_STYLE,
    theme = DEFAULT_THEME,
    loopLength = 900, // unit corresponds to the timestamp in source data
    animationSpeed = 1
}: {
    trips?: string | Trip[];
    trailLength?: number;
    loopLength?: number;
    animationSpeed?: number;
    initialViewState?: MapViewState;
    mapStyle?: string;
    theme?: Theme;
}) {
    const [time, setTime] = useState(0);
    const [tripsData, setTripsData] = useState<Trip[] | null>(null);

    useEffect(() => {
        const animation = animate({
            from: 0,
            to: loopLength,
            duration: (loopLength * 60) / animationSpeed,
            repeat: Infinity,
            onUpdate: setTime
        });
        return () => animation.stop();
    }, [loopLength, animationSpeed]);

    useEffect(() => {
        fetch(DATA_URL.TRIPS)
            .then(res => res.json())
            .then(data => setTripsData(data));
    }, []);

    const layers = [
        // This is only needed when using shadow effects
        new PolygonLayer<Position[]>({
            id: 'ground',
            data: landCover,
            getPolygon: f => f,
            stroked: false,
            getFillColor: [0, 0, 0, 0]
        }),
        new TripsLayer<Trip>({
            id: 'trips',
            data: tripsData || [],
            getPath: d => d.path,
            getTimestamps: d => d.timestamps,
            getColor: d => {
                const colors = [
                    theme.trailColor0,
                    theme.trailColor1,
                    theme.trailColor2,
                    theme.trailColor3,
                    theme.trailColor4,
                    theme.trailColor5,
                    theme.trailColor6
                ];
                return colors[d.vendor % colors.length];
            },
            opacity: 0.3,
            widthMinPixels: 2,
            rounded: true,
            trailLength,
            currentTime: time,

            shadowEnabled: false
        })
    ];

    return (
        <DeckGL
            layers={layers}
            effects={theme.effects}
            initialViewState={initialViewState}
            controller={true}
        >
            <Map reuseMaps mapStyle={mapStyle} />
        </DeckGL>
    );
}

export function renderToDOM(container: HTMLDivElement) {
    createRoot(container).render(<App />);
}
