// Import Dependencies
import { PageHeader, List, Button, Typography, Tag } from "antd";
import IconBase, { SaveOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import Layout from "@layout";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import type { GrammarDBEntry } from "@database/schema/grammar";
import type { ArrayElement } from "@/utils/ArrayElement";
import { useModal } from "@components/TextModalInput";
import { ReactComponent as RightArrowRaw } from "@assets/right-arrow.svg";
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
    grid-template-rows: repeat(2, 1fr);
    grid-template-areas:
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
    padding: 0.2rem 0.6rem;
    margin: auto 0.2rem;
    justify-content: space-between;

    background: none;
    border-radius: 8px;

    & > span {
        align-self: center;
        font-size: 0.8rem;
    }
`;
// Define Page
export default function RegularGrammarEdit(): JSX.Element {
    // Setup State
    const [grammarDb, setGrammarDb] = useState<GrammarDBEntry>();
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const grammarEntry = await db.get(FLWarriorDBTables.GRAMMAR, idToEdit);
        setGrammarDb(grammarEntry);
    }, []);
    // Define Computed Values
    const alphabetNT = useMemo(() => grammarDb?.alphabetNT, [grammarDb]);
    const alphabetT = useMemo(() => grammarDb?.alphabetT, [grammarDb]);
    const transitions = useMemo(() => grammarDb?.transitions, [grammarDb]);
    // Components Handlers
    const renameGrammar = (newName: string) => {
        setGrammarDb({ ...grammarDb, name: newName });
    };
    const saveGrammar = async () => {
        // Fetch Database
        const db = await useDatabase();
        await db.put(FLWarriorDBTables.GRAMMAR, grammarDb);
    };
    const newRuleHead = (newRuleHeadSymbols: string) => {
        setGrammarDb((grammar) => {
            if (
                grammar.transitions.findIndex(
                    ({ from: f }) => f.join() === newRuleHeadSymbols
                ) === -1
            ) {
                // Not Found -> Create New Rule
                grammar.transitions.push({
                    from: newRuleHeadSymbols.split(""),
                    to: [],
                });
            }
            return { ...grammar };
        });
    };
    const deleteRuleHead = (ruleHead: string[]) => {
        setGrammarDb((grammar) => {
            const grammarToDelete = grammar.transitions.findIndex(
                (t) => t.from.join("") === ruleHead.join("")
            );
            if (grammarToDelete >= 0) {
                grammar.transitions.splice(grammarToDelete, 1);
            }
            return { ...grammar };
        });
    };
    const deleteRuleBody = (ruleHead: string[], ruleBody: string[]) => {
        setGrammarDb((grammar) => {
            const targetRule = grammar.transitions.findIndex(
                (t) => t.from.join("") === ruleHead.join("")
            );
            if (targetRule >= 0) {
                const bodyToDelete = grammar.transitions[
                    targetRule
                ].to.findIndex((rb) => rb.join("") === ruleBody.join(""));
                grammar.transitions[targetRule].to.splice(bodyToDelete, 1);
            }
            return { ...grammar };
        });
    };
    const newRuleBody = (
        newRuleBodySymbols: string,
        { ruleHead }: { ruleHead: Array<string> }
    ) => {
        setGrammarDb((grammar) => {
            const ruleIdx = grammar.transitions.findIndex(
                (t) => t.from === ruleHead
            );
            grammar.transitions[ruleIdx].to.push(newRuleBodySymbols.split(""));
            return { ...grammar };
        });
    };
    const newAlphabetTSymbol = (newSymbol: string) => {
        setGrammarDb((grammar) => {
            if (!grammar.alphabetT.includes(newSymbol)) {
                grammar.alphabetT.push(newSymbol);
            }
            return { ...grammar };
        });
    };
    const newAlphabetNTSymbol = (newSymbol: string) => {
        setGrammarDb((grammar) => {
            if (!grammar.alphabetNT.includes(newSymbol)) {
                grammar.alphabetNT.push(newSymbol);
            }
            return { ...grammar };
        });
    };
    const onDeleteAlphabetT = (toDeleteSymbol) => {
        setGrammarDb((grammar) => {
            grammar.alphabetT.splice(
                grammar.alphabetT.findIndex((symb) => symb === toDeleteSymbol),
                1
            );
            return { ...grammar };
        });
    };
    const onDeleteAlphabetNT = (toDeleteSymbol) => {
        setGrammarDb((grammar) => {
            grammar.alphabetNT.splice(
                grammar.alphabetNT.findIndex((symb) => symb === toDeleteSymbol),
                1
            );
            return { ...grammar };
        });
    };
    // Setup Modals
    const [showModalAlphabetT, modalAlphabetTCH] = useModal({
        title: "Adicionar símbolo terminal",
        onSubmit: newAlphabetTSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1,
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
        submitDisabled: (ci) => ci.length < 1,
    });
    const [showModalNewRuleBody, modalNewRuleBodyCH] = useModal({
        title: "Adicionar novo corpo de produção",
        onSubmit: newRuleBody,
        placeholder: "Insira o novo corpo de produção (Ex.: aA)",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length < 1,
    });

    const [showModalRename, modalRenameCH] = useModal({
        title: "Renomear Autômato",
        onSubmit: renameGrammar,
        placeholder: grammarDb?.name,
        submitText: "Renomear",
        submitDisabled: (ci) => !(ci.length >= 1),
    });
    // Render Page
    return (
        <>
            <Layout>
                <GrammarEditContent>
                    <PageHeader
                        onBack={history.goBack}
                        title={`Editar - ${grammarDb?.name || idToEdit}`}
                        subTitle="Gramática Regular"
                        extra={[
                            <Button
                                key="button-rename"
                                onClick={showModalRename}
                                type="dashed"
                            >
                                Renomear
                                {modalRenameCH}
                            </Button>,
                            <Button
                                key="button-save"
                                onClick={saveGrammar}
                                icon={<SaveOutlined />}
                            >
                                Salvar
                            </Button>,
                            <Button
                                type="primary"
                                key="button-new-rule"
                                onClick={showModalNewRuleHead}
                            >
                                Adicionar Regra
                                {modalNewRuleHeadCH}
                            </Button>,
                        ]}
                    />
                    <GrammarEditGrid>
                        {/* List of States */}
                        <RulesList
                            bordered
                            header={
                                <Typography.Text>
                                    Regras de Produção
                                </Typography.Text>
                            }
                            style={{ gridArea: "rules" }}
                            dataSource={transitions}
                            renderItem={(
                                item: ArrayElement<
                                    GrammarDBEntry["transitions"]
                                >,
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
                                                    ruleHead: item.from,
                                                })
                                            }
                                        >
                                            Adicionar Corpo
                                        </Button>,
                                        <Button
                                            danger
                                            key="remove-rule"
                                            onClick={() =>
                                                deleteRuleHead(item.from)
                                            }
                                        >
                                            Deletar Produção
                                        </Button>,
                                    ]}
                                >
                                    <RuleHead>
                                        <Typography.Text strong>
                                            {item.from.join()}
                                        </Typography.Text>
                                        <RightArrow />
                                    </RuleHead>
                                    <RuleBody>
                                        {item.to.map((to, idx) => (
                                            <>
                                                {idx > 0 ? (
                                                    <TypographySpacer />
                                                ) : null}
                                                <RuleBodyTag
                                                    closable
                                                    onClose={() =>
                                                        deleteRuleBody(
                                                            item.from,
                                                            to
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
                        >
                            {modalNewRuleBodyCH}
                        </RulesList>
                        <AlphabetList
                            dataSource={alphabetT}
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
                                    {modalAlphabetTCH}
                                </AlphabetListHeader>
                            }
                            renderItem={(symb) => (
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
                            dataSource={alphabetNT}
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
                                    {modalAlphabetNTCH}
                                </AlphabetListHeader>
                            }
                            renderItem={(symb) => (
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
