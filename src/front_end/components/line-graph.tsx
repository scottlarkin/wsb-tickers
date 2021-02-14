import React from 'react';
import { Line } from '@nivo/line';
import colours from '../consts/colours';
// TODO - improve flexibility 

type Series = {
    id: string;
    data: Array<{ x: string | number | Date; y: number}>
};

type Props = {
    durationHours: number;
    data: Series[];
};

const commonProperties = {
    width: 1200,
    height: 600,
    margin: { top: 20, right: 200, bottom: 150, left: 80 },
    animate: true,
};

const getTickValues = (duration: number) => {
    const numTicks = 10;
    
    return `every ${(duration / numTicks +0.5) >> 0} hours`;
};

export default (props: Props) => {

    return <Line 
        theme={{
            tooltip: {
                container: {
                    background: colours.background,
                },
            },
            textColor: colours.text,
            grid: {
                line: {
                    stroke: colours.highlilght,
                }
            },
            axis: {
                ticks: {
                    line: {
                        stroke: colours.highlilght,
                    },
                    text: {
                        fill: colours.text,
                    },
                },
            },
        }}
        legends={[{
            direction: 'column',
            anchor: 'bottom-right',
            itemHeight: 20,
            itemWidth: 10,
            translateX: 20,
            symbolShape: 'circle',
        }]}
        useMesh={true}
        curve={'catmullRom'}
        axisBottom={{
            legendOffset: -12,
            tickRotation: 50,
            format: '%H:%M [%Y-%m-%d]',
            tickValues: getTickValues(props.durationHours),
            legend: 'time scale'
        }}
        xScale={
            {
                type: "time",
                precision: "minute",
            }
        }
        xFormat="time:%Y-%m-%d %H:%M:%S"
        {...commonProperties}
        data={props.data}
    >
    </Line >
};