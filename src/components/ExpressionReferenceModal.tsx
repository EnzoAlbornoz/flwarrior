// Import Dependencies
import { Input, Modal, Select as SelectBase, Typography } from "antd";
import styled from "styled-components";
import { useState, useMemo } from "react";
import type { ReactElement } from "react";
import { DefinitionType } from "@/database/schema/expression";
// Define Typings
interface IUseModalProps {
    title: string;
    submitText: string;
    expressionList: Array<{ id: string; name: string }>;
    submitDisabled?: (expReference: IRegexDefinitionItem) => boolean;
    onSubmit: (
        expReference: IRegexDefinitionItem,
        context?: unknown
    ) => unknown;
}
interface IRegexDefinitionProps {
    visible: boolean;
    title: string;
    submitText: string;
    context: unknown;
    expression: IRegexDefinitionItem;
    expressionList: Array<{ id: string; name: string }>;
    setExpression: (expReference: IRegexDefinitionItem) => void;
    submitDisabled?: (expReference: IRegexDefinitionItem) => boolean;
    onDispose: () => void;
    onSubmit: (
        expReference: IRegexDefinitionItem,
        context?: unknown
    ) => unknown;
}
export interface IRegexDefinitionItem {
    reference: string;
    type: DefinitionType;
    content: string;
}
// Define Styles
const Select = styled(SelectBase)`
    display: block;
`;
// Define Component
export function RegexDefinition({
    visible,
    title,
    submitText,
    context,
    expression,
    expressionList,
    setExpression,
    submitDisabled,
    onDispose,
    onSubmit,
}: IRegexDefinitionProps): JSX.Element {
    const isSubmitDisabled = useMemo(() => submitDisabled?.(expression), [
        submitDisabled,
        expression,
    ]);

    return (
        <Modal
            centered
            title={title}
            visible={visible}
            okButtonProps={{ disabled: isSubmitDisabled }}
            okText={submitText}
            onOk={() => onSubmit(expression, context)}
            onCancel={onDispose}
            closable
        >
            {/* Define Reference */}
            <Typography.Text>Referência dentro da Expressão</Typography.Text>
            <Input
                placeholder="Exemplo: ab{R}aka"
                onChange={(ev) =>
                    setExpression({
                        ...expression,
                        reference: ev?.target?.value,
                    })
                }
                value={expression?.reference}
            />
            {/* Define Type */}
            <Typography.Text>Tipo da Referencia</Typography.Text>
            <Select
                onSelect={(type) =>
                    setExpression({
                        ...expression,
                        type: type.toString() as DefinitionType,
                    })
                }
            >
                <Select.Option value="LOCAL">Local</Select.Option>
                <Select.Option value="GLOBAL">Global</Select.Option>
            </Select>
            {/* Define Content Based on Type */}
            {expression?.type === "LOCAL" ? (
                <>
                    <Typography.Text>
                        Insira a Definição Regular
                    </Typography.Text>
                    <Input
                        onChange={(ev) =>
                            setExpression({
                                ...expression,
                                content: ev?.target?.value,
                            })
                        }
                    />
                </>
            ) : null}
            {expression?.type === "GLOBAL" ? (
                <>
                    <Typography.Text>
                        Selecione a Definição Regular
                    </Typography.Text>
                    <Select
                        onSelect={(type) =>
                            setExpression({
                                ...expression,
                                content: type.toString(),
                            })
                        }
                        options={expressionList?.map(({ name, id }) => ({
                            value: id,
                            label: name,
                        }))}
                    />
                </>
            ) : null}
        </Modal>
    );
}
export function useModal(
    config: IUseModalProps
): [(ctx?: unknown) => void, ReactElement] {
    const [isVisible, setVisible] = useState(false);
    const [context, setContext] = useState(null);
    const [definition, setDefinition] = useState(null);
    const onSubmitIntercept = (data: IRegexDefinitionItem) => {
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
        RegexDefinition({
            visible: isVisible,
            submitText: config.submitText,
            title: config.title,
            context,
            expression: definition,
            expressionList: config.expressionList,
            setExpression: setDefinition,
            onSubmit: onSubmitIntercept,
            submitDisabled: config.submitDisabled,
            onDispose: dispose,
        }),
    ];
}
