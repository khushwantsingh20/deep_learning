// https://github.com/ant-design/ant-design-pro/blob/master/src/components/Exception/typeConfig.js
import permissionDeniedImage from './images/403.svg';
import pageNotFoundImage from './images/404.svg';
import serverErrorImage from './images/500.svg';

const config = {
    403: {
        img: permissionDeniedImage,
        title: '403',
        desc: 'Permission Denied',
    },
    404: {
        img: pageNotFoundImage,
        title: '404',
        desc: 'Page Not Found',
    },
    500: {
        img: serverErrorImage,
        title: '500',
        desc: 'Server Error',
    },
};

export default config;
