import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Classnames from 'classnames';
import { Editor } from 'react-draft-wysiwyg';
import { convertToRaw, EditorState } from 'draft-js';
import { convertFromHTML } from 'draft-convert';
import draftToHtml from 'draftjs-to-html';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import styles from './HtmlWidget.less';

export default function HtmlWidget(props) {
    const getEditorState = useCallback(() => {
        if (props.value) {
            // Options to handle superscript, subscript, and underline text
            const opts = {
                styleToHTML: style => {
                    if (style === 'SUPERSCRIPT') {
                        return { start: '<sup>', end: '</sup>' };
                    }
                    if (style === 'SUBSCRIPT') {
                        return { start: '<sub>', end: '</sub>' };
                    }
                    if (style === 'UNDERLINE') {
                        return { start: '<ins>', end: '</ins>' };
                    }
                    return null;
                },
                htmlToStyle: (nodeName, node, currentStyle) => {
                    if (nodeName === 'sup') {
                        return currentStyle.add('SUPERSCRIPT');
                    }
                    if (nodeName === 'sub') {
                        return currentStyle.add('SUBSCRIPT');
                    }
                    if (nodeName === 'ins') {
                        return currentStyle.add('UNDERLINE');
                    }
                    return currentStyle;
                },
            };
            const content = convertFromHTML(opts)(props.value);
            if (content) {
                return EditorState.createWithContent(content);
            }
        }
        return EditorState.createEmpty();
    }, [props.value]);

    const [editorState, setEditorState] = useState(getEditorState);
    const valueChangeTriggeredInternally = useRef(false);

    /**
     * Used to fix the html paste bug:
     * https://github.com/jpuri/react-draft-wysiwyg/issues/697
     */
    const handlePastedText = () => false;

    const setEditorRef = ref => {
        if (!ref) {
            return;
        }
        if (props.autoFocus) {
            ref.focus();
        }
    };

    const onEditorStateChange = updatedEditorState => {
        setEditorState(updatedEditorState);

        const content = updatedEditorState.getCurrentContent();
        let finalContent = '';
        if (content.hasText() && content.getPlainText().trim().length) {
            finalContent = draftToHtml(convertToRaw(content));
        }
        if (finalContent !== props.value) {
            valueChangeTriggeredInternally.current = true;
        }

        props.onChange(finalContent);
    };

    useEffect(() => {
        if (valueChangeTriggeredInternally.current) {
            // ignore changes triggered by the editor itself
            valueChangeTriggeredInternally.current = false;
        } else {
            setEditorState(getEditorState());
        }
    }, [getEditorState, props.value]);

    return (
        <Editor
            editorClassName={Classnames(styles.htmlWidgetEditor, props.editorClassName)}
            editorRef={setEditorRef}
            editorState={editorState}
            handlePastedText={handlePastedText}
            onBlur={props.onBlur}
            onEditorStateChange={onEditorStateChange}
            onFocus={props.onFocus}
            placeholder={props.placeholder}
            toolbar={props.toolbar}
            toolbarClassName={Classnames(styles.htmlWidgetToolbar, props.toolbarClassName)}
            toolbarCustomButtons={props.toolbarCustomButtons}
            wrapperClassName={Classnames(styles.htmlWidgetWrapper, props.wrapperClassName)}
        />
    );
}

HtmlWidget.propTypes = {
    autoFocus: PropTypes.bool,
    editorClassName: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    placeholder: PropTypes.string,
    toolbar: PropTypes.object,
    toolbarClassName: PropTypes.string,
    toolbarCustomButtons: PropTypes.array,
    value: PropTypes.string,
    wrapperClassName: PropTypes.string,
};

HtmlWidget.defaultProps = {
    toolbar: {},
};
