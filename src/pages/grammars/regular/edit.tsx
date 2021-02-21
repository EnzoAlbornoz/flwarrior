// Import Dependencies
import { PageHeader, List, Button, Typography, Modal, Input } from "antd";
import { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import Layout from "@layout";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import type { GrammarDBEntry } from "@database/schema/grammar";
import type { ArrayElement } from "@/utils/ArrayElement";
import { useModal } from "@/components/TextModalInput";
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
    grid-template-rows: auto;
    grid-template-areas:
        "rules alphabetT"
        "rules alphabetNT";
`;
// Define Page
export default function RegularGrammarEdit(): JSX.Element {
    // Setup State
    const [grammarDb, setGrammarDb] = useState<GrammarDBEntry>();
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Define Handlers
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const grammarEntry = await db.get(FLWarriorDBTables.GRAMMAR, idToEdit);
        setGrammarDb(grammarEntry);
    }, []);
    // Define Computed Values
    const alphabetNT = useMemo(() => grammarDb?.alphabetNT, [grammarDb]);
    const alphabetT = useMemo(() => grammarDb?.alphabetT, [grammarDb]);
    // Components States
    const [
        newAlphabetTModalIsVisible,
        setNewAlphabetTModalIsVisible,
    ] = useState(false);
    const [
        newAlphabetNTModalIsVisible,
        setNewAlphabetNTModalIsVisible,
    ] = useState(false);
    const [newAlphabetTModalValue, setNewAlphabetTModalValue] = useState("");
    const [newAlphabetNTModalValue, setNewAlphabetNTModalValue] = useState("");
    // Components Handlers
    // const onNewRuleHead = () =>
    const newAlphabetTSymbol = (newSymbol: string) => {
        setGrammarDb((grammar) => {
            if (!grammar.alphabetT.includes(newSymbol)) {
                grammar.alphabetT.push(newSymbol);
            }
            return { ...grammar };
        });
    };
    const onNewAlphabetNT = () => {
        const newSymbol = newAlphabetNTModalValue;
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
    const [showModalAlphabetT, modalAlphabetTCH] = useModal({
        title: "Adicionar símbolo terminal",
        onSubmit: newAlphabetTSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1,
    });
    // Render Page
    return (
        <>
            <Layout>
                <GrammarEditContent>
                    <PageHeader
                        onBack={history.goBack}
                        title={`Editar - ${idToEdit}`}
                        subTitle="Gramática Regular"
                        extra={[
                            <Button key="button-new-rule">
                                Adicionar Regra
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
                            dataSource={[
                                { from: ["S"], to: [["a"], ["a", "S"]] },
                            ]}
                            renderItem={(
                                item: ArrayElement<
                                    GrammarDBEntry["transitions"]
                                >,
                                index
                            ) => (
                                <List.Item key={index}>
                                    {item.from.join()}
                                </List.Item>
                            )}
                        />
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
                                    <Button
                                        onClick={() => (
                                            setNewAlphabetNTModalValue(""),
                                            setNewAlphabetNTModalIsVisible(true)
                                        )}
                                    >
                                        Adicionar
                                    </Button>
                                    <Modal
                                        title="Adicionar símbolo não terminal"
                                        visible={newAlphabetNTModalIsVisible}
                                        okButtonProps={{
                                            disabled:
                                                newAlphabetNTModalValue.length !==
                                                1,
                                        }}
                                        onOk={() => (
                                            setNewAlphabetNTModalIsVisible(
                                                false
                                            ),
                                            onNewAlphabetNT()
                                        )}
                                        onCancel={() =>
                                            setNewAlphabetNTModalIsVisible(
                                                false
                                            )
                                        }
                                    >
                                        <Input
                                            onSubmit={() =>
                                                newAlphabetNTModalValue.length ===
                                                1
                                                    ? (setNewAlphabetNTModalIsVisible(
                                                          false
                                                      ),
                                                      onNewAlphabetNT())
                                                    : null
                                            }
                                            placeholder="Insira o novo símbolo"
                                            value={newAlphabetNTModalValue}
                                            onChange={(ev) =>
                                                setNewAlphabetNTModalValue(
                                                    ev?.target?.value
                                                )
                                            }
                                        />
                                    </Modal>
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
