// Import Dependencies
import Immutable from "immutable";
import { useDatabase } from "@/database";
import { FLWarriorDBTables } from "@/database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import Layout from "@layout";
import { Button, Input, List, message, PageHeader, Typography } from "antd";
import { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { toDBEntry as machineToDBEntry } from "@lib/automaton/Machine";
import { useModal } from "@/components/TextModalInput";
import {
    IIRegex,
    IRegex,
    fromDBEntry,
    rename,
    toDBEntry,
    addDefinition,
    setExpression,
} from "@/lib/expressions/Regex";
import { SaveOutlined } from "@ant-design/icons";
import { useModal as expressionRefModal } from "@components/ExpressionReferenceModal";
import { DefinitionType } from "@/database/schema/expression";
import { convertRegularExpressionToNonDeterministicFiniteMachine } from "@/lib/conversion";

// Import Types
interface ITGEditPageProps {
    id: string;
}
interface IAddDefinitionResult {
    reference: string;
    type: DefinitionType;
    content: string;
}
interface IRegexRef {
    id: string;
    name: string;
}
// Define Styles
const ExpressionEdit = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const RegexEditBody = styled.section`
    display: flex;
    /* Align center */
    width: calc(100% - 48px);
    height: 100%;
    margin: 1.5rem auto;
    /* Display on Grid */
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    grid-template-rows: auto 8fr;
    grid-template-areas:
        "regexInput"
        "definitions";
`;
const InputBar = styled.section`
    display: flex;
    flex-direction: column;
    grid-area: "regexInput";
`;
const DefinitionsList = styled(List)`
    /* Full Panel Size */
    grid-area: "definitions";
    flex-grow: 1;
`;
const DefinitionsListHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
// Define Page
export default function ExecuteFiniteAutomata(): JSX.Element {
    // Setup State
    const [regex, setRegex] = useState<IIRegex>();
    const [regexRefList, setRegexRefList] = useState<Immutable.List<IRegexRef>>(
        Immutable.List()
    );
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const regexEntry = await db.get(FLWarriorDBTables.EXPRESSION, idToEdit);
        const regexLib = fromDBEntry(regexEntry);
        setRegex(regexLib);
    }, []);

    // Define Computed Values
    const name = useMemo(() => regex?.get("name") as IRegex["name"], [regex]);
    const expressionValue = useMemo(
        () => regex?.get("expression") as IRegex["expression"],
        [regex]
    );
    // Define Methods
    const renameExpression = (newName: string) =>
        setRegex(rename(regex, newName));

    const saveExpression = async () => {
        // Build Serialized Expression
        const serializedExpression = toDBEntry(regex);
        // Fetch Database
        const db = await useDatabase();
        await db.put(FLWarriorDBTables.EXPRESSION, serializedExpression);
        message.success("Expressão salva!", 1);
    };
    const addReference = (ref: IAddDefinitionResult) =>
        setRegex(addDefinition(regex, ref.reference, ref.type, ref.content));
    // Special Functions
    const convertToMachine = async () => {
        // Convert To Machine
        const machine = convertRegularExpressionToNonDeterministicFiniteMachine(
            regex
        );
        const newMachine = machine;
        // Save New Machine
        const serializedMachine = machineToDBEntry(newMachine);
        const db = await useDatabase();
        await db.put(FLWarriorDBTables.MACHINE, serializedMachine);
        // Go to Machine Editor Page
        return history.push(`/automata/finite/edit/${serializedMachine.id}`);
    };
    // Define Modals
    const [showModalRename, modalRenameCH] = useModal({
        title: "Renomear Expressão",
        onSubmit: renameExpression,
        placeholder: name,
        submitText: "Renomear",
        submitDisabled: (ci) => !(ci.length >= 1),
    });
    const [showModalAddRef, modalAddRefCH] = expressionRefModal({
        title: "Renomear Expressão",
        onSubmit: addReference,
        submitText: "Adicionar Referência",
        expressionList: regexRefList.toArray(),
        submitDisabled: (ref: IAddDefinitionResult) =>
            !(ref?.reference?.length > 0 && ref?.content?.length > 0),
    });
    // Render Page
    return (
        <>
            <Layout>
                <ExpressionEdit>
                    {/* Modals */}
                    {modalRenameCH}
                    {modalAddRefCH}
                    {/* Page Header */}
                    <PageHeader
                        onBack={history.goBack}
                        title={`Editar - ${name || idToEdit}`}
                        subTitle="Expressão Regular"
                        extra={[
                            <Button
                                key="button-convert-machine"
                                onClick={convertToMachine}
                            >
                                Converter - Máquina
                            </Button>,
                            <Button
                                key="button-rename"
                                onClick={showModalRename}
                                type="dashed"
                            >
                                Renomear
                            </Button>,
                            <Button
                                key="button-save"
                                onClick={saveExpression}
                                icon={<SaveOutlined />}
                            >
                                Salvar
                            </Button>,
                        ]}
                    />
                    {/* Page Body */}
                    <RegexEditBody>
                        <InputBar>
                            <Typography.Text>
                                Expressão Regular:
                            </Typography.Text>
                            <Input
                                onChange={(ev) =>
                                    setRegex(
                                        setExpression(regex, ev?.target?.value)
                                    )
                                }
                                value={expressionValue}
                            />
                        </InputBar>
                        <DefinitionsList
                            bordered
                            header={
                                <DefinitionsListHeader>
                                    <Typography.Text>
                                        Definições
                                    </Typography.Text>
                                    <Button onClick={showModalAddRef} disabled>
                                        Adicionar (Desabilitado)
                                    </Button>
                                </DefinitionsListHeader>
                            }
                        />
                    </RegexEditBody>
                </ExpressionEdit>
            </Layout>
        </>
    );
}
