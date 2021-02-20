// Import Dependencies
import { Button, PageHeader } from "antd";
import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import RegisteredItemsListRaw from "@components/RegisteredItemsList";
import Layout from "@layout";
import styled from "styled-components";
import IconBase from "@ant-design/icons";
import { ReactComponent as Book } from "@assets/book.svg";
import DatabaseService from "@database";
import { FLWarriorDBTables } from "@/database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { GrammarDBEntry } from "@/database/schema/grammar";
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
const BookAvatar = styled(IconBase).attrs({ component: Book })`
    font-size: 2em;
`;
// Define Component
export default function RegularGrammar(): JSX.Element {
    // Setup State
    const [grammarList, setGrammarList] = useState<Array<GrammarDBEntry>>([]);
    // Fetch Context
    const history = useHistory();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await DatabaseService.getDb();
        const grammars = await db.getAll(FLWarriorDBTables.GRAMMAR);

        setGrammarList(grammars);
        console.log(grammars);
    }, []);
    const grammarListDataSource = useMemo(
        () =>
            grammarList.map((grammar) => ({
                id: grammar.id,
                name: grammar.name,
                avatar: <BookAvatar />,
                onEdit: (itemId: string) => {
                    console.log("EDIT - ", itemId);
                },
                onDelete: (itemId: string) => {
                    console.log("DELETE - ", itemId);
                },
                onExport: (itemId: string) => {
                    console.log("EXPORT - ", itemId);
                },
            })),
        [grammarList]
    );
    // Extra
    const createAutomata = () => console.log("CREATE");
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
                                onClick={createAutomata}
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
