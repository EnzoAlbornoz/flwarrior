// Import Dependencies
import { Modal, Select as SelectBase } from "antd";
import styled from "styled-components";
import { useState, useMemo } from "react";
import type { ReactElement } from "react";
// Define Typings
interface IUseModalProps {
    title: string;
    submitText: string;
    operationSymbol: ReactElement;
    machineList: Array<{ id: string; name: string }>;
    submitDisabled?: (cselectedMachines: Array<string>) => boolean;
    onSubmit: (selectedMachines: Array<string>, context?: unknown) => unknown;
}
interface ITwoMachineSelectModalContentProps {
    visible: boolean;
    title: string;
    submitText: string;
    context: unknown;
    machines: Array<string>;
    machineList: Array<{ id: string; name: string }>;
    operationSymbol: ReactElement;
    setMachines: (selectMachines: Array<string>) => void;
    submitDisabled?: (selectMachines: Array<string>) => boolean;
    onDispose: () => void;
    onSubmit: (selectedMachines: Array<string>, context?: unknown) => unknown;
}
// Define Styles
const Select = styled(SelectBase)`
    display: block;
`;
// Define Component
export function TwoMachineSelectModalContent({
    visible,
    title,
    submitText,
    context,
    machines,
    operationSymbol,
    machineList,
    setMachines,
    submitDisabled,
    onDispose,
    onSubmit,
}: ITwoMachineSelectModalContentProps): JSX.Element {
    const isSubmitDisabled = useMemo(() => submitDisabled?.(machines), [
        submitDisabled,
        machines,
    ]);

    return (
        <Modal
            centered
            title={title}
            visible={visible}
            okButtonProps={{ disabled: isSubmitDisabled }}
            okText={submitText}
            onOk={() => onSubmit(machines, context)}
            onCancel={onDispose}
            closable
        >
            {/* Left Machine */}
            <Select
                onChange={(leftId) =>
                    setMachines([leftId.toString(), machines[1]])
                }
                placeholder="Selecione uma Máquina"
                options={machineList.map((m) => ({
                    label: m.name,
                    value: m.id,
                    key: m.id,
                }))}
            />
            {/* Show Operation */}
            {operationSymbol}
            {/* Right Machine */}
            <Select
                onChange={(rightId) =>
                    setMachines([machines[0], rightId.toString()])
                }
                placeholder="Selecione uma Máquina"
                options={machineList.map((m) => ({
                    label: m.name,
                    value: m.id,
                    key: m.id,
                }))}
            />
        </Modal>
    );
}
export function useModal(
    config: IUseModalProps
): [(ctx?: unknown) => void, ReactElement] {
    const [isVisible, setVisible] = useState(false);
    const [context, setContext] = useState(null);
    const [machines, setMachines] = useState([]);
    const onSubmitIntercept = (data: Array<string>) => {
        setVisible(false);
        setContext(null);
        config.onSubmit(data, context);

        console.debug("Submitted");
    };
    const show = (ctx?: unknown) => {
        setVisible(true);
        setContext(ctx);
        console.debug("Showing");
    };
    const dispose = () => {
        setVisible(false);
        setContext(null);
        console.debug("Disposing");
    };

    return [
        show,
        TwoMachineSelectModalContent({
            visible: isVisible,
            submitText: config.submitText,
            title: config.title,
            context,
            machines,
            machineList: config.machineList,
            setMachines,
            onSubmit: onSubmitIntercept,
            submitDisabled: config.submitDisabled,
            onDispose: dispose,
            operationSymbol: config.operationSymbol,
        }),
    ];
}
