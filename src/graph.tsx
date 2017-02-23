/** @jsx snabb.svg */
import xs, { Stream } from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { scaleTime, scaleLinear, ScaleLinear, ScaleTime } from 'd3-scale';
import { line, Line } from 'd3-shape';
import { VNode } from '@cycle/dom';

import { Sources, Sinks, State, Component, WebsocketData } from './interfaces';

export interface GraphInfo {
    heading : string;
    yScaleText : string;
    dataIndex : number[];
}

export interface Scales {
    x : ScaleTime<number, number>;
    y : ScaleLinear<number, number>;
    state? : State;
}

export type DataPoint = [number, number];

const colors : string[] = [
    'red',
    'green',
    'blue',
    'black'
];

export function createGraph(info : GraphInfo) : Component
{
    return function({ state, Time } : Sources) : Sinks
    {
        const updateDOM$ : Stream<undefined> = Time.periodic(500)
            .mapTo(undefined);

        const scale$ : Stream<Scales> = updateDOM$
            .compose(sampleCombine(state))
            .map(([_, s]) => s)
            .map(s => ({
                x: scaleTime()
                    .domain([secondsAgo(1), hoursAgo(0.1)])
                    .range([0, 2000]),
                y: scaleLinear()
                    .domain(getDomain(s.domains, info.dataIndex))
                    .range([0, 400]),
                state: s
            }));

        const scaledData$ : Stream<DataPoint[][]> = scale$
            .map(scales => [scales, selectData(scales.state.values, info.dataIndex)] as [Scales, [Date, number][][]])
            .map(([scales, arr]) => {
                return arr.map(data => data.map(d => [scales.x(d[0]), scales.y(d[1])] as [number, number]));
            });

        const path$ : Stream<VNode[]> = scaledData$
            .map<string[]>(data => data.map(arr => line<DataPoint>()(arr)))
            .map<VNode[]>(lines => lines.map((s, i) => {
                return <path
                    d={ s }
                    stroke={ colors[i] }
                    class-path={ true }
                />;
            }));

        const vdom$ : Stream<VNode> = path$
            .map(paths =>
                <svg
                    viewBox='0 0 2000 400'
                    preserveAspectRatio='xMinYMin slice'
                    class-graph={ true }
                >
                    { paths }
                </svg>
            );

        return {
            DOM: vdom$
        };
    };
}

function selectData(datas : [Date, number][][], dataIndex : number[]) : [Date, number][][]
{
    return datas.filter((d, i) => dataIndex.indexOf(i) !== -1);
}

function getDomain(domains : [number, number][], dataIndex : number[]) : [number, number]
{
    return domains
        .filter((d, i) => dataIndex.indexOf(i) !== -1)
        .reduce((acc, curr) => {
            const min : number = Math.min(curr[0], acc[0]);
            const max : number = Math.max(curr[1], acc[1]);
            return [min, max];
        }, [Infinity, -Infinity]);
}

function hoursAgo(count : number) : Date
{
    return new Date(
        new Date().getTime() - 1000 * 60 * 60 * count
    );
}

function secondsAgo(count : number) : Date
{
    return new Date(
        new Date().getTime() - 1000 * count
    );
}
