// Import Dependencies
import { Input, Modal } from "antd";
import { useState, useMemo } from "react";
import type { ReactElement } from "react";
// Define Typings
interface IUseModalProps {
    title: string;
    submitText: string;
    placeholder: string;
    submitDisabled?: (currentInput: string) => boolean;
    onSubmit: (inputValue: string, context?: unknown) => unknown;
}
interface ITextModalInputContentProps {
    visible: boolean;
    title: string;
    placeholder: string;
    submitText: string;
    context: unknown;
    input: string;
    setInput: (data: string) => void;
    submitDisabled?: (currentInput: string) => boolean;
    onDispose: () => void;
    onSubmit: (inputValue: string, context?: unknown) => unknown;
}
// Define Component
export function TextModalInputContent({
    visible,
    title,
    placeholder,
    submitText,
    context,
    input,
    setInput,
    submitDisabled,
    onDispose,
    onSubmit,
}: ITextModalInputContentProps): JSX.Element {
    const isSubmitDisabled = useMemo(() => submitDisabled?.(input), [
        submitDisabled,
        input,
    ]);

    return (
        <Modal
            centered
            title={title}
            visible={visible}
            okButtonProps={{ disabled: isSubmitDisabled }}
            okText={submitText}
            onOk={() => onSubmit(input, context)}
            onCancel={onDispose}
            closable
        >
            <Input
                autoFocus
                value={input}
                placeholder={placeholder}
                onChange={(ev) => setInput(ev?.target?.value)}
                onSubmit={() =>
                    isSubmitDisabled ? null : onSubmit(input, context)
                }
                onPressEnter={() => (
                    isSubmitDisabled ? null : onSubmit(input), context
                )}
            />
        </Modal>
    );
}
export function useModal(
    config: IUseModalProps
): [(ctx?: unknown) => void, ReactElement] {
    const [isVisible, setVisible] = useState(false);
    const [input, setInput] = useState("");
    const [context, setContext] = useState(null);
    const onSubmitIntercept = (data: string) => {
        setVisible(false);
        setContext(null);
        config.onSubmit(data, context);
    };
    const show = (ctx?: unknown) => {
        setInput("");
        setVisible(true);
        setContext(ctx);
    };
    const dispose = () => {
        setInput("");
        setVisible(false);
        setContext(null);
    };

    return [
        show,
        TextModalInputContent({
            input,
            setInput,
            visible: isVisible,
            placeholder: config.placeholder,
            submitText: config.submitText,
            title: config.title,
            context,
            onSubmit: onSubmitIntercept,
            submitDisabled: config.submitDisabled,
            onDispose: dispose,
        }),
    ];
}
