import PropTypes from 'prop-types';
import { Spin, Button, DatePicker } from 'antd';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import requirePermissions from '../../../common/auth/hoc/requirePermissions';
import AdminPageHeader from '../../components/AdminPageHeader';

import styles from '../booking.less';
import { Booking } from '../models';
import useBookingIntensity from '../hooks/useBookingIntensity';
import useNow from '../hooks/useNow';

function BookingIntensityGraph({ response, dayFrom }) {
    const data = [];

    [...Array(24).keys()].map(i => {
        data.push({
            name: `${i.toString().padStart(2, '0')}00`,
            cars:
                (response.counts[`${dayFrom.format('YYYY-MM-DD-')}${i - 1}`] || 0) +
                (response.counts[`${dayFrom.format('YYYY-MM-DD-')}${i}`] || 0),
        });
        return null;
    });

    return (
        <ResponsiveContainer width="100%" aspect={4.0 / 3.0}>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} tick={{ angle: -45, dy: 5 }} />
                <YAxis label={{ value: 'Cars #', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="cars" fill="#2cace3" />
            </BarChart>
        </ResponsiveContainer>
    );
}

BookingIntensityGraph.propTypes = {
    response: PropTypes.object.isRequired,
    dayFrom: PropTypes.object.isRequired,
};

function BookingIntensityChart({ response, dayFrom, total, now }) {
    const thisHour = now.get('hours');
    return (
        <div className="ant-table">
            <table>
                <thead className="ant-table-thead">
                    <tr>
                        <th>Time</th>
                        {[...Array(7).keys()].map(i => {
                            const day = dayFrom.clone().add(i, 'days');
                            const isToday = day.format('MM-DD') === now.format('MM-DD');
                            const dayHighlight = isToday ? styles.highlight : undefined;

                            return (
                                <th colSpan={2} className={dayHighlight}>
                                    {day.format('ddd DD/MM')}
                                </th>
                            );
                        })}
                        <th>%</th>
                    </tr>
                </thead>
                <tbody className="ant-table-tbody">
                    {[...Array(24).keys()].map(i => {
                        const hourSum = [...Array(7).keys()].reduce(
                            (acc, v) =>
                                acc +
                                (response.counts[
                                    `${dayFrom
                                        .clone()
                                        .add(v, 'days')
                                        .format('YYYY-MM-DD-')}${i}`
                                ] || 0),
                            0
                        );
                        return (
                            <>
                                <tr key={i}>
                                    <td className={thisHour === i ? styles.highlight : undefined}>
                                        {i.toString().padStart(2, '0')}00
                                    </td>
                                    {[...Array(7).keys()].map(j => {
                                        const day = dayFrom.clone().add(j, 'days');
                                        const isToday = day.format('MM-DD') === now.format('MM-DD');
                                        return (
                                            <>
                                                <td
                                                    className={
                                                        isToday && thisHour === i
                                                            ? styles.highlight
                                                            : undefined
                                                    }
                                                >
                                                    {response.counts[
                                                        `${day.format('YYYY-MM-DD-')}${i}`
                                                    ] || 0}
                                                </td>
                                                <td
                                                    className={
                                                        isToday && thisHour === i
                                                            ? styles.highlight
                                                            : undefined
                                                    }
                                                >
                                                    {(response.counts[
                                                        `${day.format('YYYY-MM-DD-')}${i - 1}`
                                                    ] || 0) +
                                                        (response.counts[
                                                            `${day.format('YYYY-MM-DD-')}${i}`
                                                        ] || 0)}
                                                </td>
                                            </>
                                        );
                                    })}

                                    <td
                                        className={`${styles.percentageColumn} ${
                                            thisHour === i ? styles.highlight : undefined
                                        }`}
                                    >
                                        {total ? ((hourSum * 100) / total).toFixed(0) : 0}
                                    </td>
                                </tr>
                            </>
                        );
                    })}
                    <tr>
                        <td className={styles.total}>Total</td>
                        {[...Array(7).keys()].map(j => {
                            const day = dayFrom.clone().add(j, 'days');
                            return (
                                <>
                                    <td className={styles.total}>
                                        {[...Array(24).keys()].reduce(
                                            (acc, v) =>
                                                acc +
                                                (response.counts[
                                                    `${day.format('YYYY-MM-DD-')}${v}`
                                                ] || 0),
                                            0
                                        )}
                                    </td>
                                    <td className={styles.total} />
                                </>
                            );
                        })}

                        <td className={styles.total}>100%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

BookingIntensityChart.propTypes = {
    response: PropTypes.object.isRequired,
    dayFrom: PropTypes.object.isRequired,
    now: PropTypes.object.isRequired,
    total: PropTypes.number.isRequired,
};

function BookingIntensityListView() {
    const { now } = useNow();
    const { response, refresh, setDayFrom, dayFrom } = useBookingIntensity();
    const [graph, setGraph] = useState(false);

    if (!response) {
        return <Spin />;
    }

    const total = Object.values(response.counts).reduce((a, b) => a + b, 0);

    return (
        <div className={styles.intensity}>
            <AdminPageHeader header="Booking Intensity" htmlTitle="Booking Intensity" />
            <div className={styles.body}>
                <div>
                    {graph && (
                        <BookingIntensityGraph
                            response={response}
                            dayFrom={dayFrom}
                            total={total}
                        />
                    )}
                    {!graph && (
                        <BookingIntensityChart
                            response={response}
                            dayFrom={dayFrom}
                            total={total}
                            now={now}
                        />
                    )}
                </div>
                <div>
                    <div className={styles.sideBar}>
                        <div className={styles.currentDate}>
                            <div className={styles.currentCalendarDate}>
                                {now.format('Do MMMM YYYY')}
                            </div>
                            <div className={styles.currentTime}>{now.format('HH:mm:ss')}</div>
                            <p className={styles.bookingsToday}>
                                <span>{response.today}</span> booking
                                {response.today === 1 ? '' : 's'} today
                            </p>
                        </div>

                        <div className={styles.carsAvailable}>
                            <fieldset>
                                <legend>Cars Available Today</legend>
                                <div className="ant-form-item">
                                    <label htmlFor="am">AM:</label>
                                    <input id="am" />
                                </div>
                                <div className="ant-form-item">
                                    <label htmlFor="pm">PM:</label>
                                    <input id="pm" />
                                </div>
                                <div className="ant-form-item">
                                    <label htmlFor="late">Late:</label>
                                    <input id="late" />
                                </div>
                            </fieldset>
                        </div>

                        <div className={styles.dateFilter}>
                            <label>Choose Date:</label>
                            <DatePicker defaultValue={now} onChange={setDayFrom} />
                        </div>
                        <div className={styles.toggleType}>
                            <Button
                                type="primary"
                                size="large"
                                ghost
                                onClick={() => setGraph(!graph)}
                            >
                                Display as {graph ? 'Chart' : 'Graph'}
                            </Button>
                        </div>

                        <div className={styles.refresh}>
                            <Button type="primary" onClick={refresh} icon="reload">
                                Refresh Now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default requirePermissions({ action: 'listIntensity', model: Booking })(
    BookingIntensityListView
);
