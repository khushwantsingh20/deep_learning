import React from 'react';

export function formatAddress(addr) {
    addr = addr.split(', ').map((part, i) => <span key={`${part}-${i}`}>{part}</span>);
    return <span className="formattedAddress">{addr}</span>;
}

export function formatPlaceName(placeName, addr) {
    if (!placeName || !addr) {
        return '';
    }

    const formattedAddr = addr.split(',').slice(0, -1);
    if (formattedAddr[0] !== placeName) {
        return (
            <>
                <div>{placeName}</div>
            </>
        );
    }
    return '';
}
