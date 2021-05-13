// Import Dependencies
import {
    PageHeader,
    List,
    Button,
    Typography,
    Tag,
    Select,
    Modal,
    message,
} from "antd";
import IconBase, {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import Immutable from "immutable";
import Layout from "@layout";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import { useModal } from "@components/TextModalInput";
import { ReactComponent as RightArrowRaw } from "@assets/right-arrow.svg";
import {
    IGrammar,
    IGrammarWord,
    addNonTerminalSymbol,
    addProductionBody,
    addProductionHead,
    addTerminalSymbol,
    fromDBEntry,
    IIGrammar,
    removeNonTerminalSymbol,
    removeProductionBody,
    removeProductionHead,
    removeTerminalSymbol,
    rename,
    toDBEntry,
    setStartSymbol as setGrammarStartSymbol,
    removeLeftProduction,
    factorize,
    removeUnreachableSymbols,
    removeEpsilonProductions,
    removeUnitProductions,
    getAnalysisTable,
    runTableLL1,
} from "@lib/grammar/Grammar";
import {
    GrammarDBEntry,
    GrammarType,
    translateGrammarType,
} from "@/database/schema/grammar";
import { END_OF_STACK, EPSILON } from "@/lib/AlphabetSymbol";
// Define Typings
export interface ITGEditPageProps {
    id: string;
}
// Define Style
const GrammarEditContent = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const RulesList = styled(List)`
    /* Full Panel Size */
    flex-grow: 1;
    /* Pagination on End */
    display: flex;
    flex-direction: column;
    /* justify-content: space-between; */
`;
const AlphabetList = styled(List)`
    /* Full Panel Size */
    flex-grow: 1;
`;
const AlphabetListHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
const RuleListHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
const GrammarEditGrid = styled.section`
    /* Full Height */
    flex-grow: 1;
    /* Align center */
    width: calc(100% - 48px);
    margin: 1.5rem auto;

    /* Display on Grid */
    display: grid;
    gap: 1rem;
    grid-template-columns: 8fr 2fr;
    grid-template-rows: 1fr 5fr 5fr;
    grid-template-areas:
        "rules startSymbol"
        "rules alphabetT"
        "rules alphabetNT";
`;
const RuleHead = styled.section`
    display: flex;
    align-items: center;
    font-size: 1.8em;
`;
const RuleBody = styled.section`
    flex-grow: 1;
    text-align: left;
    font-size: 1.5rem;
`;
const RightArrow = styled(IconBase).attrs({ component: RightArrowRaw })`
    margin: auto 1rem;
`;
const TypographySpacer = styled(Typography.Text).attrs({
    strong: true,
    children: "|",
})`
    margin: auto 0.5rem;
`;
const RuleBodyTag = styled(Tag)`
    display: inline-flex;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0.2rem 0.8rem;
    padding-right: 0.2rem;
    margin: auto 0.2rem;
    justify-content: space-between;

    background: none;
    border-radius: 8px;

    & > span {
        align-self: center;
        font-size: 0.9rem;
    }
`;
const SelectBar = styled.section`
    display: flex;
    flex-direction: column;
`;
// Define Page
export default function ContextFreeGrammarEdit(): JSX.Element {
    // Setup State
    const [grammar, setGrammar] = useState<IIGrammar>();
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const grammarEntry = await db.get(FLWarriorDBTables.GRAMMAR, idToEdit);
        const grammarLib = fromDBEntry(grammarEntry);
        setGrammar(grammarLib);
    }, []);
    // Define Computed Values
    const name = useMemo(() => grammar?.get("name"), [grammar]) as string;
    const alphabetNT = useMemo(() => grammar?.get("nonTerminalSymbols"), [
        grammar,
    ]) as IGrammar["nonTerminalSymbols"];
    const alphabetT = useMemo(() => grammar?.get("terminalSymbols"), [
        grammar,
    ]) as IGrammar["terminalSymbols"];
    const transitions = useMemo(() => grammar?.get("productionRules"), [
        grammar,
    ]) as IGrammar["productionRules"];
    const startSymbol = useMemo(() => grammar?.get("startSymbol"), [
        grammar,
    ]) as IGrammar["startSymbol"];
    // Components Handlers
    const checkGrammarType = (
        grammarEntry: GrammarDBEntry,
        allowedTypes: Array<GrammarType>
    ) => {
        if (!allowedTypes.includes(grammarEntry.type)) {
            message.error(
                "".concat(
                    `Gramática de tipo ${translateGrammarType(
                        grammarEntry.type
                    ).toLowerCase()} não pode ser aceita! `,
                    "Por favor, utilize uma gramática mais restrita."
                ),
                3
            );
            return false;
        }
        return true;
    };
    const renameGrammar = (newName: string) =>
        setGrammar(rename(grammar, newName));
    const saveGrammar = async () => {
        // Check Grammar Complete
        if (
            (grammar.get(
                "productionRules"
            ) as IGrammar["productionRules"]).some((bodies) => !bodies.size)
        ) {
            message.error(
                "[Erro] Não foi possível salvar pois há produções incompletas."
            );
            return;
        }
        // Serialize grammar
        const serializedGrammar = toDBEntry(grammar);
        if (
            checkGrammarType(serializedGrammar, [
                GrammarType.CONTEXT_FREE,
                GrammarType.REGULAR,
            ])
        ) {
            // Fetch Database
            const db = await useDatabase();
            await db.put(FLWarriorDBTables.GRAMMAR, serializedGrammar);
            message.success("Gramática salva!", 1);
        }
    };
    const newRuleHead = (newRuleHeadSymbols: string) =>
        setGrammar(addProductionHead(grammar, newRuleHeadSymbols.split("")));
    const deleteRuleHead = (ruleHead: string[]) =>
        setGrammar(removeProductionHead(grammar, ruleHead));
    const deleteRuleBody = (ruleHead: string[], ruleBody: string[]) =>
        setGrammar(removeProductionBody(grammar, ruleHead, ruleBody));
    const newRuleBody = (
        newRuleBodySymbols: string,
        context: { ruleHead: Array<string> }
    ) =>
        setGrammar(
            addProductionBody(
                grammar,
                context.ruleHead,
                newRuleBodySymbols.replace(/&/g, EPSILON).split("")
            )
        );
    const newAlphabetTSymbol = (newSymbol: string) =>
        setGrammar(addTerminalSymbol(grammar, newSymbol.replace("&", EPSILON)));

    const newAlphabetNTSymbol = (newSymbol: string) =>
        setGrammar(addNonTerminalSymbol(grammar, newSymbol));

    const onDeleteAlphabetT = (toDeleteSymbol: string) =>
        setGrammar(removeTerminalSymbol(grammar, toDeleteSymbol));
    const onDeleteAlphabetNT = (toDeleteSymbol) =>
        setGrammar(removeNonTerminalSymbol(grammar, toDeleteSymbol));
    const setStartSymbol = (newStartSymbol: string) =>
        setGrammar(setGrammarStartSymbol(grammar, newStartSymbol));
    // Special Functions
    const removeLeftRecursionFromGrammar = () =>
        setGrammar(
            removeLeftProduction(
                factorize(
                    removeUnitProductions(
                        removeEpsilonProductions(
                            removeUnreachableSymbols(grammar)
                        )
                    )
                )
            )
        );
    const factorizeGrammar = () => {
        try {
            setGrammar(
                factorize(
                    removeLeftProduction(
                        removeEpsilonProductions(
                            removeUnreachableSymbols(grammar)
                        )
                    )
                )
            );
        } catch (error) {
            message.error(error?.message, 2);
        }
    };
    // Setup Modals
    const [showModalAlphabetT, modalAlphabetTCH] = useModal({
        title: "Adicionar símbolo terminal",
        onSubmit: newAlphabetTSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1 || ci === END_OF_STACK,
    });
    const [showModalAlphabetNT, modalAlphabetNTCH] = useModal({
        title: "Adicionar símbolo não terminal",
        onSubmit: newAlphabetNTSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1,
    });
    const [showModalNewRuleHead, modalNewRuleHeadCH] = useModal({
        title: "Adicionar nova cabeça de produção",
        onSubmit: newRuleHead,
        placeholder: "Insira a nova cabeça de produção (Ex.: S)",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length === 0 || !alphabetNT.includes(ci),
    });
    const [showModalNewRuleBody, modalNewRuleBodyCH] = useModal({
        title: "Adicionar novo corpo de produção",
        onSubmit: newRuleBody,
        placeholder: "Insira o novo corpo de produção (Ex.: aA)",
        submitText: "Adicionar",
        submitDisabled: (ci) =>
            ci.length === 0 ||
            ci.split("").some((bodySymbol) => {
                const transBodySymbol = bodySymbol.replace("&", EPSILON);
                return !(
                    alphabetT.includes(transBodySymbol) ||
                    alphabetNT.includes(transBodySymbol)
                );
            }),
    });

    const testGrammarRecognition = (text: string) => {
        try {
            // Prepare Grammar
            const preparedGrammar = factorize(
                removeLeftProduction(
                    removeEpsilonProductions(removeUnreachableSymbols(grammar))
                )
            );
            // Create Analysis Table
            const analysisTable = getAnalysisTable(preparedGrammar);
            // Test Against String
            const recognized = runTableLL1(
                text,
                preparedGrammar,
                analysisTable
            );
            // Show Message
            if (recognized) {
                Modal.success({
                    icon: <CheckCircleOutlined />,

                    content: "Texto reconhecido!",
                });
            } else {
                Modal.error({
                    icon: <CloseCircleOutlined />,
                    content: "Não foi possível reconhecer o texto",
                });
            }
        } catch (error) {
            message.error(error?.message, 3);
        }
    };

    const [showRecognitionModal, modalRecognitionModal] = useModal({
        title: "Reconhecimento de Sentença",
        onSubmit: testGrammarRecognition,
        placeholder: "Insira a senteça a ser reconhecida",
        submitText: "Verificar",
        submitDisabled: () => false,
    });

    const [showModalRename, modalRenameCH] = useModal({
        title: "Renomear Gramática",
        onSubmit: renameGrammar,
        placeholder: name,
        submitText: "Renomear",
        submitDisabled: (ci) => !(ci.length >= 1),
    });
    // Render Page
    return (
        <>
            <Layout>
                <>
                    {/* Modals */}
                    {modalRenameCH}
                    {modalNewRuleHeadCH}
                    {modalNewRuleBodyCH}
                    {modalAlphabetTCH}
                    {modalAlphabetNTCH}
                    {modalRecognitionModal}
                </>
                <GrammarEditContent>
                    <PageHeader
                        onBack={history.goBack}
                        title={`Editar - ${name || idToEdit}`}
                        subTitle="Gramática Livre de Contexto"
                        extra={[
                            <Button
                                key="button-recognize"
                                onClick={showRecognitionModal}
                            >
                                Reconhecer sentença
                            </Button>,
                            <Button
                                key="button-remove-left-recursion"
                                onClick={removeLeftRecursionFromGrammar}
                            >
                                Remover Rec. à Esquerda
                            </Button>,
                            <Button
                                key="button-factorize"
                                onClick={factorizeGrammar}
                            >
                                Fatorar
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
                                onClick={saveGrammar}
                                icon={<SaveOutlined />}
                            >
                                Salvar
                            </Button>,
                        ]}
                    />
                    <GrammarEditGrid>
                        {/* List of States */}
                        <RulesList
                            bordered
                            header={
                                <RuleListHeader>
                                    <Typography.Text>
                                        Regras de Produção
                                    </Typography.Text>

                                    <Button
                                        type="primary"
                                        key="button-new-rule"
                                        onClick={showModalNewRuleHead}
                                    >
                                        Adicionar Regra
                                    </Button>
                                </RuleListHeader>
                            }
                            style={{ gridArea: "rules" }}
                            dataSource={transitions?.toArray()}
                            renderItem={(
                                [head, body]: [
                                    IGrammarWord,
                                    Immutable.Set<IGrammarWord>
                                ],
                                index
                            ) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Button
                                            type="primary"
                                            key="new-rule-body"
                                            onClick={() =>
                                                showModalNewRuleBody({
                                                    ruleHead: head.toArray(),
                                                })
                                            }
                                        >
                                            Adicionar Corpo
                                        </Button>,
                                        <Button
                                            danger
                                            key="remove-rule"
                                            onClick={() =>
                                                deleteRuleHead(head.toArray())
                                            }
                                        >
                                            Deletar Produção
                                        </Button>,
                                    ]}
                                >
                                    <RuleHead>
                                        <Typography.Text strong>
                                            {head.join("")}
                                        </Typography.Text>
                                        <RightArrow />
                                    </RuleHead>
                                    <RuleBody>
                                        {body.toArray().map((to, idx) => (
                                            <>
                                                {idx > 0 ? (
                                                    <TypographySpacer />
                                                ) : null}
                                                <RuleBodyTag
                                                    key={to.join("")}
                                                    closable
                                                    onClose={() =>
                                                        deleteRuleBody(
                                                            head.toArray(),
                                                            to.toArray()
                                                        )
                                                    }
                                                >
                                                    {to.join("")}
                                                </RuleBodyTag>
                                            </>
                                        ))}
                                    </RuleBody>
                                </List.Item>
                            )}
                        />
                        <SelectBar style={{ gridArea: "startSymbol" }}>
                            <Typography.Text>Simbolo Inicial</Typography.Text>
                            <Select
                                defaultActiveFirstOption
                                value={startSymbol}
                                onChange={(asymbol) =>
                                    setStartSymbol(asymbol.toString())
                                }
                            >
                                {alphabetNT?.map((asymbol) => (
                                    <Select.Option
                                        value={asymbol}
                                        key={asymbol}
                                    >
                                        {asymbol}
                                    </Select.Option>
                                ))}
                            </Select>
                        </SelectBar>
                        <AlphabetList
                            dataSource={alphabetT?.toArray()}
                            style={{
                                gridArea: "alphabetT",
                            }}
                            bordered
                            header={
                                <AlphabetListHeader>
                                    <Typography.Text>
                                        Alfabeto Terminal
                                    </Typography.Text>
                                    <Button onClick={showModalAlphabetT}>
                                        Adicionar
                                    </Button>
                                </AlphabetListHeader>
                            }
                            renderItem={(symb: string) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            onClick={() =>
                                                onDeleteAlphabetT(symb)
                                            }
                                            danger
                                        >
                                            Deletar
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta title={symb} />
                                </List.Item>
                            )}
                        />
                        <AlphabetList
                            dataSource={alphabetNT?.toArray()}
                            style={{
                                gridArea: "alphabetNT",
                            }}
                            bordered
                            header={
                                <AlphabetListHeader>
                                    <Typography.Text>
                                        Alfabeto Não Terminal
                                    </Typography.Text>
                                    <Button onClick={showModalAlphabetNT}>
                                        Adicionar
                                    </Button>
                                </AlphabetListHeader>
                            }
                            renderItem={(symb: string) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            onClick={() =>
                                                onDeleteAlphabetNT(symb)
                                            }
                                            danger
                                        >
                                            Deletar
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta title={symb} />
                                </List.Item>
                            )}
                        />
                    </GrammarEditGrid>
                </GrammarEditContent>
            </Layout>
        </>
    );
}
