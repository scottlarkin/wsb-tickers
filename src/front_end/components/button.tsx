import React from 'react';
import styled from 'styled-components';

type Props = {
    text: string;
    onClick: () => void;
};

const Button = styled.button`
    width: 80px;
    height: 25px;
    background-color: #575757;
    border: none;
    border-radius: 4px;
    
    :hover {
        background-color: #718ab8;

    }
`;

export default (props: Props) => {
    return <>
        <Button type="button" onClick={props.onClick}>{props.text}</Button>
    </>;
};