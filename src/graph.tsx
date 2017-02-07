/** @jsx snabb.svg */
import xs, { Stream } from 'xstream';
import { scaleTime, scaleLinear, ScaleLinear, ScaleTime } from 'd3-scale';
import { line, Line } from 'd3-shape';
import { VNode } from '@cycle/dom';

import { Sources, Sinks, Component, WebsocketData } from './interfaces';

export interface GraphInfo {
    heading : string;
    yScaleText : string;
    yDomain : [number, number];
    dataFilter : (d : WebsocketData) => number;
}

export interface Scales {
    x : ScaleTime<number, number>;
    y : ScaleLinear<number, number>;
}

export type DataPoint = [number, number];

export function createGraph(info : GraphInfo) : Component
{
    return function({ state } : Sources) : Sinks
    {
        const scale$ : Stream<Scales> = xs.of({
            x: scaleTime()
                .domain([new Date(), hoursAgo(2)])
                .range([0, 500]), //TODO: Dynamic width
            y: scaleLinear()
                .domain(info.yDomain)
                .range([0, 400]) //TODO: Dynamic height
        });

        const scaledData$ : Stream<DataPoint[]> = xs.combine(scale$, state)
            .map(([scales, arr]) => arr.map(data => {
                const x : number = scales.x(data.time);
                const y : number = scales.y(info.dataFilter(data));
                return [x, y] as DataPoint;
            }));

        const path$ : Stream<VNode> = scaledData$
            .map<string>(arr => line<DataPoint>()(arr))
            .map<VNode>(line => <path d={ line } />);

        const vdom$ : Stream<VNode> = path$
            .map(path =>
                <svg>
                    { path }
                </svg>
            );

        return {
            DOM: vdom$
        };
    };
}

function hoursAgo(count : number) : Date
{
    return new Date(
        new Date().getTime() - 1000 * 60 * 60 * count
    );
}