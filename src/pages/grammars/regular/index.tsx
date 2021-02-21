// Import Dependencies
import { Button, PageHeader } from "antd";
import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import RegisteredItemsListRaw from "@components/RegisteredItemsList";
import Layout from "@layout";
import styled from "styled-components";
import IconBase from "@ant-design/icons";
import { ReactComponent as Regex } from "@assets/regex.svg";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import {
    getNewGrammar,
    GrammarDBEntry,
    GrammarType,
} from "@database/schema/grammar";
// Define Style
const GrammarsList = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const RegisteredItemsList = styled(RegisteredItemsListRaw)`
    /* Full Panel Size */
    flex-grow: 1;
    margin-bottom: 1rem;

    /* Align center */
    width: calc(100% - 48px);
    margin: 1.5rem auto;

    /* Pagination on End */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;
const RegexAvatar = styled(IconBase).attrs({ component: Regex })`
    font-size: 2em;
`;
// Define Component
export default function RegularGrammars(): JSX.Element {
    // Setup State
    const [grammarList, setGrammarList] = useState<Array<GrammarDBEntry>>([]);
    // Fetch Context
    const history = useHistory();
    // Define Handlers
    const editGrammar = (itemId: string) => {
        // Go to editing page
        history.push(`/grammars/regular/edit/${itemId}`);
    };
    const createGrammar = async () => {
        // Instantiate Basic Grammar
        const newGrammar = getNewGrammar(GrammarType.REGULAR);
        // Add Grammar to database
        const db = await useDatabase();
        await db.add(FLWarriorDBTables.GRAMMAR, newGrammar);
        // Edit new grammar
        editGrammar(newGrammar.id);
    };
    const deleteGrammar = async (itemId: string) => {
        // Remove Grammar from Database
        const db = await useDatabase();
        db.delete(FLWarriorDBTables.GRAMMAR, itemId);
        // Remove Grammar from Grammar List
        setGrammarList(grammarList.filter((grammar) => grammar.id !== itemId));
    };
    const exportGrammar = async (itemId: string) => {
        // Fetch Grammar from Database
        const db = await useDatabase();
        const grammar = await db.get(FLWarriorDBTables.GRAMMAR, itemId);
        // Save as File
        const serializedGrammar = JSON.stringify(grammar);
        const grammarFile = new File(
            [serializedGrammar],
            `${grammar.type}-${grammar.id}.json`,
            { type: "application/json;charset=utf-8" }
        );
        saveAs(grammarFile);
    };
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const grammars = await db.getAll(FLWarriorDBTables.GRAMMAR);
        setGrammarList(grammars);
    }, []);
    const grammarListDataSource = useMemo(
        () =>
            grammarList.map((grammar) => ({
                id: grammar.id,
                name: grammar.name,
                avatar: <RegexAvatar />,
                onEdit: editGrammar,
                onDelete: deleteGrammar,
                onExport: exportGrammar,
            })),
        [grammarList]
    );
    // Fetch Data
    return (
        <>
            <Layout>
                <GrammarsList>
                    <PageHeader
                        onBack={history.goBack}
                        title="Gramáticas Regulares"
                        subTitle="Listagem"
                        extra={[
                            <Button
                                type="primary"
                                key="button-create"
                                onClick={createGrammar}
                            >
                                Criar Gramática
                            </Button>,
                        ]}
                    />
                    <RegisteredItemsList dataSource={grammarListDataSource} />
                </GrammarsList>
            </Layout>
        </>
    );
}
