// Import Dependencies
import Immutable from "immutable";
import styled from "styled-components";
import { FunctionComponent, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import {
    Button,
    PageHeader,
    List,
    Typography,
    Input,
    Table,
    Modal,
    Select,
    Space,
    message,
} from "antd";
import Layout from "@layout";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import {
    EClassDefinitionType,
    IClassDefinition,
    ILexToken,
} from "@/lib/lexicalAnalyzer";
import { useDatabase } from "@/database";
import {
    ExpressionDBEntry,
    ExpressionType,
} from "@/database/schema/expression";
import { FLWarriorDBTables } from "@/database/schema";
import { MachineDBEntry, MachineType } from "@/database/schema/machine";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { tokenize } from "@lib/lexicalAnalyzer";
// Define Types
const LexicalAnalyzer = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const LexicalAnalyzerBody = styled.section`
    /* Align center */
    width: calc(100% - 48px);
    height: 100%;
    margin: 1.5rem auto;
    /* Display on Grid */
    display: grid;
    gap: 1rem;
    grid-template-columns: 5fr 5fr;
    grid-template-rows: 3fr 7fr;
    grid-template-areas:
        "text definitions"
        "tokens definitions";
`;
const TextUnderAnalysisArea = styled.section`
    grid-area: text;
`;
const InputTextArea = styled(Input.TextArea)`
    resize: none;
    && {
        height: 100%;
    }
`;
const SymbolsTableArea = styled.section`
    grid-area: tokens;
`;
const SymbolsTable = styled(Table)``;
const DefinitionsList = styled(List)`
    /* Full Panel Size */
    grid-area: definitions;
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
// Define Page
const ExpressionLexicalPage: FunctionComponent = () => {
    // Fetch Context
    const history = useHistory();
    // Define State
    const [tokenList, setTokenList] = useState<Array<ILexToken>>([]);
    const [regularDefinitionClasses, setRegularDefinitionClasses] = useState<
        Immutable.List<IClassDefinition>
    >(Immutable.List());
    const [analyzedText, setAnalyzedText] = useState("");
    // Define Modal Methods
    const [useableClasses, setUseableClasses] = useState<
        Array<{
            id: string;
            name: string;
            type: EClassDefinitionType;
        }>
    >([]);
    const loadUseableClassesFromDB = async () => {
        // Load DB
        const db = await useDatabase();
        // Load Expressions
        const expressions = (
            await db.getAllFromIndex(
                FLWarriorDBTables.EXPRESSION,
                "type",
                IDBKeyRange.only(ExpressionType.REGULAR)
            )
        ).map(({ id, name }: ExpressionDBEntry) => ({
            id,
            name,
            type: EClassDefinitionType.REGEX,
        }));
        // Load Machines
        const machines = (
            await db.getAllFromIndex(
                FLWarriorDBTables.MACHINE,
                "type",
                IDBKeyRange.only(MachineType.FINITE_STATE_MACHINE)
            )
        ).map(({ id, name }: MachineDBEntry) => ({
            id,
            name,
            type: EClassDefinitionType.MACHINE,
        }));
        // Concat Arrays
        setUseableClasses([...expressions, ...machines]);
    };
    const [
        referenceToImport,
        setReferenceToImport,
    ] = useState<IClassDefinition>({
        className: null,
        refId: null,
        type: null,
    });
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const disposeModal = () => {
        setIsImportModalVisible(false);
        setReferenceToImport({
            className: null,
            refId: null,
            type: null,
        });
    };
    const confirmModal = () => {
        // Update Classes
        setRegularDefinitionClasses(
            regularDefinitionClasses.push(referenceToImport)
        );
        // Dispose Modal
        disposeModal();
    };
    const showModal = () => {
        setIsImportModalVisible(true);
    };
    const isSubmitDisabled = useMemo(
        () => Object.values(referenceToImport).some((value) => value === null),
        [referenceToImport]
    );
    // Define Computed Values
    const possibleClasses = useMemo(
        () =>
            useableClasses.filter(
                (useableClass) => useableClass.type === referenceToImport.type
            ),
        [useableClasses, referenceToImport]
    );
    // Define Methods
    const tokenizeText = async () => {
        // Import DB
        const db = await useDatabase();
        // Tokenize
        try {
            const tokens = await tokenize(
                analyzedText,
                regularDefinitionClasses,
                db
            );
            setTokenList(tokens);
        } catch (error) {
            // Show Error To User
            message.error(error.message);
        }
    };
    const removeRegularDefinitionClass = (defClass: IClassDefinition) =>
        setRegularDefinitionClasses(
            regularDefinitionClasses.delete(
                regularDefinitionClasses.findIndex(
                    (rdClass) => rdClass === defClass
                )
            )
        );
    const swapPos = (idxFrom, idxTo) => {
        setRegularDefinitionClasses(
            regularDefinitionClasses
                .set(idxFrom, regularDefinitionClasses.get(idxTo))
                .set(idxTo, regularDefinitionClasses.get(idxFrom))
        );
    };
    // Define Effects
    useAsyncEffect(loadUseableClassesFromDB, []);
    // Render Page
    return (
        <>
            <Layout>
                <Modal
                    title="Adicionar Classe"
                    visible={isImportModalVisible}
                    onCancel={disposeModal}
                    onOk={confirmModal}
                    okText="Adicionar"
                    okButtonProps={{ disabled: isSubmitDisabled }}
                >
                    <Space direction="vertical" style={{ width: "100%" }}>
                        <Typography.Text strong>Nome da Classe</Typography.Text>
                        <Input
                            placeholder="Ex: ID"
                            onChange={({ target: { value } = {} }) =>
                                setReferenceToImport({
                                    ...referenceToImport,
                                    className: value,
                                })
                            }
                            value={referenceToImport?.className}
                        />
                        <Typography.Text strong>Fonte</Typography.Text>
                        <Select
                            value={referenceToImport?.type}
                            onSelect={(value) =>
                                setReferenceToImport({
                                    ...referenceToImport,
                                    type:
                                        EClassDefinitionType[value.toString()],
                                })
                            }
                            style={{ width: "100%" }}
                            options={[
                                {
                                    value: EClassDefinitionType.MACHINE,
                                    label: "Autômatos Finitos",
                                },
                                {
                                    value: EClassDefinitionType.REGEX,
                                    label: "Expressão Regular",
                                },
                            ]}
                        />
                        {referenceToImport?.type ? (
                            <>
                                <Typography.Text strong>
                                    Referência
                                </Typography.Text>
                                <Select
                                    value={referenceToImport?.refId}
                                    onSelect={(value) =>
                                        setReferenceToImport({
                                            ...referenceToImport,
                                            refId: value.toString(),
                                        })
                                    }
                                    style={{ width: "100%" }}
                                    options={possibleClasses.map(
                                        ({ id, name }) => ({
                                            value: id,
                                            label: name,
                                        })
                                    )}
                                />
                            </>
                        ) : null}
                    </Space>
                </Modal>
                <LexicalAnalyzer>
                    <PageHeader
                        onBack={history.goBack}
                        title="Analizador Léxico"
                        subTitle="Expressões Regulares"
                        extra={[
                            <Button
                                key="button-save"
                                type="primary"
                                onClick={tokenizeText}
                                icon={<SearchOutlined />}
                            >
                                Análise
                            </Button>,
                        ]}
                    />
                    <LexicalAnalyzerBody>
                        <TextUnderAnalysisArea>
                            <InputTextArea
                                placeholder="Insira aqui o texto à analisar..."
                                value={analyzedText}
                                onChange={(event) =>
                                    setAnalyzedText(event.target.value)
                                }
                            />
                        </TextUnderAnalysisArea>
                        <DefinitionsList
                            dataSource={regularDefinitionClasses.toArray()}
                            bordered
                            header={
                                <DefinitionsListHeader>
                                    <Typography.Text>
                                        Definições Regulares
                                    </Typography.Text>
                                    <Button onClick={showModal}>
                                        Adicionar Classe
                                    </Button>
                                </DefinitionsListHeader>
                            }
                            renderItem={(classDef: IClassDefinition, idx) => (
                                <List.Item
                                    key={idx}
                                    actions={[
                                        <Button
                                            danger
                                            key="remove-definition"
                                            onClick={() =>
                                                removeRegularDefinitionClass(
                                                    classDef
                                                )
                                            }
                                        >
                                            Deletar Definição
                                        </Button>,
                                        <Button
                                            key="prio-up"
                                            onClick={() =>
                                                swapPos(idx, idx - 1)
                                            }
                                            icon={<ArrowUpOutlined />}
                                            disabled={idx === 0}
                                        />,
                                        <Button
                                            key="prio-down"
                                            onClick={() =>
                                                swapPos(idx, idx + 1)
                                            }
                                            icon={<ArrowDownOutlined />}
                                            disabled={
                                                idx ===
                                                regularDefinitionClasses.size -
                                                    1
                                            }
                                        />,
                                    ]}
                                >
                                    <DefinitionListBody size="middle">
                                        <Typography.Text strong>
                                            {classDef.className}
                                        </Typography.Text>
                                        <Typography.Text strong>
                                            [{classDef.type}]
                                        </Typography.Text>
                                        -{/* <RightArrow /> */}
                                        <Typography.Text>
                                            {
                                                useableClasses.find(
                                                    (uc) =>
                                                        uc.id === classDef.refId
                                                ).name
                                            }
                                        </Typography.Text>
                                    </DefinitionListBody>
                                </List.Item>
                            )}
                        />
                        <SymbolsTableArea>
                            <SymbolsTable
                                dataSource={tokenList}
                                pagination={false}
                                bordered
                                columns={[
                                    { title: "Token", dataIndex: "token" },
                                    { title: "Classe", dataIndex: "class" },
                                ]}
                            />
                        </SymbolsTableArea>
                    </LexicalAnalyzerBody>
                </LexicalAnalyzer>
            </Layout>
        </>
    );
};
// Export Page
export default ExpressionLexicalPage;
