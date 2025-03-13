// Based on https://github.com/ant-design/ant-design-pro/tree/master/src/components/Exception
import React from 'react';
import cx from 'classnames';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import styles from './Error.less';
import config from './config';

export default function Error(props) {
    const {
        className,
        linkElement: LinkElement = Link,
        type,
        title,
        desc,
        img,
        actions,
        ...rest
    } = props;
    const pageType = type in config ? type : '404';
    return (
        <div className={cx(styles.exception, className)} {...rest}>
            <div className={styles.imgBlock}>
                <div
                    className={styles.imgEle}
                    style={{ backgroundImage: `url(${img || config[pageType].img})` }}
                />
            </div>
            <div className={styles.content}>
                <h1>{title || config[pageType].title}</h1>
                <div className={styles.desc}>{desc || config[pageType].desc}</div>
                <div className={styles.actions}>
                    {actions || (
                        <LinkElement to="/" href="/">
                            <Button type="primary">Home</Button>
                        </LinkElement>
                    )}
                </div>
            </div>
        </div>
    );
}

Error.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string,
    linkElement: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.node),
    title: PropTypes.node,
    desc: PropTypes.node,
    img: PropTypes.string,
};
