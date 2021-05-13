// Import Dependencies
import { Modal, Select } from "antd";
import { useState, useMemo } from "react";
import type { ReactElement } from "react";
// Define Typings
interface IUseModalPropsOption {
    label: string;
    value: string;
}
interface IUseModalProps {
    title: string;
    options: Array<IUseModalPropsOption>;
    submitText: string;
    placeholder: string;
    submitDisabled?: (currentInput: string) => boolean;
    onSubmit: (inputValue: string, context?: unknown) => unknown;
}
interface ISelectModalInputContentProps {
    visible: boolean;
    title: string;
    placeholder: string;
    submitText: string;
    context: unknown;
    input: string;
    options: Array<IUseModalPropsOption>;
    setInput: (data: string) => void;
    submitDisabled?: (currentInput: string) => boolean;
    onDispose: () => void;
    onSubmit: (inputValue: string, context?: unknown) => unknown;
}
// Define Component
export function SelectModalInputContent({
    visible,
    title,
    placeholder,
    submitText,
    context,
    input,
    options,
    setInput,
    submitDisabled,
    onDispose,
    onSubmit,
}: ISelectModalInputContentProps): JSX.Element {
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
            <Select
                style={{ width: "100%" }}
                autoFocus
                options={options}
                value={input}
                onSelect={(value) => setInput(value)}
                placeholder={placeholder}
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
        SelectModalInputContent({
            input,
            setInput,
            visible: isVisible,
            placeholder: config.placeholder,
            submitText: config.submitText,
            title: config.title,
            context,
            options: config.options,
            onSubmit: onSubmitIntercept,
            submitDisabled: config.submitDisabled,
            onDispose: dispose,
        }),
    ];
}
