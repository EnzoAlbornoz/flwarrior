// Import Dependencies
import { Input, Modal } from "antd";
import {
    useState,
    useRef,
    useContext,
    createContext,
    useMemo,
    useEffect,
} from "react";
import type { ReactElement } from "react";
// Define Typings
interface IUseModalProps {
    title: string;
    submitText: string;
    placeholder: string;
    submitDisabled?: (currentInput: string) => boolean;
    onSubmit: (inputValue: string) => unknown;
}
interface ITextModalInputContentProps {
    input: string;
    setInput: (data: string) => void;
    title: string;
    visible: boolean;
    submitText: string;
    placeholder: string;
    submitDisabled?: (currentInput: string) => boolean;
    onSubmit: (inputValue: string) => unknown;
}
// Define Component
export function TextModalInputContent({
    input,
    setInput,
    visible,
    title,
    placeholder,
    submitDisabled,
    submitText,
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
            onOk={() => onSubmit(input)}
        >
            <Input
                onSubmit={() => (isSubmitDisabled ? null : onSubmit(input))}
                value={input}
                placeholder={placeholder}
                onChange={(ev) => setInput(ev?.target?.value)}
            />
        </Modal>
    );
}
export function useModal(config: IUseModalProps): [() => void, ReactElement] {
    const [isVisible, setVisible] = useState(false);
    const [input, setInput] = useState("");
    const onSubmitIntercept = (data: string) => {
        setVisible(false);
        config.onSubmit(data);
    };
    const show = () => {
        setInput("");
        setVisible(true);
    };

    return [
        show,
        TextModalInputContent({
            input,
            setInput,
            visible: isVisible,
            onSubmit: onSubmitIntercept,
            placeholder: config.placeholder,
            submitText: config.submitText,
            title: config.title,
            submitDisabled: config.submitDisabled,
        }),
    ];
}
