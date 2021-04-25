// Import Dependencies
import Immutable from "immutable";
import { useDatabase } from "@/database";
import { FLWarriorDBTables } from "@/database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import Layout from "@layout";
import {
    Button,
    Input,
    List,
    message,
    PageHeader,
    Space,
    Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { toDBEntry as machineToDBEntry } from "@lib/automaton/Machine";
import { useModal } from "@/components/TextModalInput";
import { ReactComponent as RightArrowRaw } from "@assets/right-arrow.svg";
import {
    IIRegex,
    IRegex,
    fromDBEntry,
    rename,
    toDBEntry,
    addDefinition,
    setExpression,
    IIRegexDefinition,
    removeDefinition,
    resolveDefinitions,
} from "@/lib/expressions/Regex";
import IconBase, { SaveOutlined } from "@ant-design/icons";
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
const DefinitionListBody = styled(Space)`
    font-size: 1.2rem;
`;
const RightArrow = styled(IconBase).attrs({ component: RightArrowRaw })`
    margin: auto 1rem;
`;
// Define Page
export default function EditRegularExpression(): JSX.Element {
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
        // Fetch Current Regex
        const regexEntry = await db.get(FLWarriorDBTables.EXPRESSION, idToEdit);
        const regexLib = fromDBEntry(regexEntry);
        setRegex(regexLib);
        // Fetch Regex Ref List
        const regexList: Array<IRegexRef> = (
            await db.getAll(FLWarriorDBTables.EXPRESSION)
        )
            .filter((entry) => entry.id !== idToEdit)
            .map(({ id, name }) => ({ id, name }));
        setRegexRefList(Immutable.List(regexList));
    }, []);

    // Define Computed Values
    const name = useMemo(() => regex?.get("name") as IRegex["name"], [regex]);
    const expressionValue = useMemo(
        () => regex?.get("expression") as IRegex["expression"],
        [regex]
    );
    const definitions = useMemo(
        () =>
            (
                (regex?.get(
                    "definitions"
                ) as IRegex["definitions"])?.toArray() || []
            ).map(([ref, def]) => [
                ref,
                def,
                regexRefList?.find((regRef) => regRef.id === def.get("content"))
                    ?.name,
            ]),
        [regex, regexRefList]
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
    const removeReference = (refEntry: string) =>
        setRegex(removeDefinition(regex, refEntry));
    // Special Functions
    const convertToMachine = async () => {
        // Convert To Machine
        const dbClient = await useDatabase();
        const convertedMachine = await resolveDefinitions(regex, dbClient);
        const machine = convertRegularExpressionToNonDeterministicFiniteMachine(
            convertedMachine,
            true
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
                                    <Button onClick={showModalAddRef}>
                                        Adicionar
                                    </Button>
                                </DefinitionsListHeader>
                            }
                            dataSource={definitions}
                            renderItem={(
                                [alias, def, defName]: [
                                    string,
                                    IIRegexDefinition,
                                    string
                                ],
                                idx
                            ) => (
                                <List.Item
                                    key={idx}
                                    actions={[
                                        <Button
                                            danger
                                            key="remove-definition"
                                            onClick={() =>
                                                removeReference(alias)
                                            }
                                        >
                                            Deletar Definição
                                        </Button>,
                                    ]}
                                >
                                    <DefinitionListBody size="middle">
                                        <Typography.Text strong>
                                            {alias}
                                        </Typography.Text>
                                        <RightArrow />
                                        <Typography.Text strong>
                                            {"Ref: "}
                                        </Typography.Text>
                                        <Typography.Text>
                                            {def.get("type") === "GLOBAL"
                                                ? defName
                                                : def.get("content")}
                                        </Typography.Text>
                                    </DefinitionListBody>
                                </List.Item>
                            )}
                        />
                    </RegexEditBody>
                </ExpressionEdit>
            </Layout>
        </>
    );
}
