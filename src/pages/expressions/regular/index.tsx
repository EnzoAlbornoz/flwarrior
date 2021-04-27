// Import Dependencies
import { Button, PageHeader, Upload } from "antd";
import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import RegisteredItemsListRaw from "@components/RegisteredItemsList";
import Layout from "@layout";
import styled from "styled-components";
import IconBase from "@ant-design/icons";
import { ReactComponent as Regex } from "@assets/regex.svg";
import DatabaseService, { useDatabase } from "@database";
import { FLWarriorDBTables } from "@/database/schema";
import useAsyncEffect from "@/utils/useAsyncEffect";
import {
    ExpressionDBEntry,
    ExpressionType,
    getNewExpression,
} from "@/database/schema/expression";
import { UploadChangeParam } from "antd/lib/upload";
// Define Style
const ExpressionssList = styled.section`
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
export default function RegularExpressions(): JSX.Element {
    // Setup State
    const [expressionsList, setExpressionsList] = useState<
        Array<ExpressionDBEntry>
    >([]);
    // Fetch Context
    const history = useHistory();
    // Define Handlers
    const loadExpressionsFromDB = async () => {
        const db = await DatabaseService.getDb();
        const expressions = await db.getAll(FLWarriorDBTables.EXPRESSION);
        setExpressionsList(expressions);
    };
    const editExpression = (itemId: string) => {
        // Go to editing page
        history.push(`/expressions/regular/edit/${itemId}`);
    };
    const lexicalAnalysis = () => {
        // Go to lexical analysis
        history.push("/analysis/lexical");
    };
    const createExpression = async () => {
        // Instantiate Basic Expression
        const newexpression = getNewExpression(ExpressionType.REGULAR);
        // Add expression to database
        const db = await useDatabase();
        await db.add(FLWarriorDBTables.EXPRESSION, newexpression);
        // Edit new expression
        editExpression(newexpression.id);
    };
    const deletEexpression = async (itemId: string) => {
        // Remove expression from Database
        const db = await useDatabase();
        db.delete(FLWarriorDBTables.EXPRESSION, itemId);
        // Remove Expression from Expression List
        setExpressionsList(
            expressionsList.filter((expression) => expression.id !== itemId)
        );
    };
    const exportExpression = async (itemId: string) => {
        // Fetch expression from Database
        const db = await useDatabase();
        const expression = await db.get(FLWarriorDBTables.EXPRESSION, itemId);
        // Save as File
        const serializedexpression = JSON.stringify(expression);
        const expressionFile = new File(
            [serializedexpression],
            `${expression.type}-${expression.id}.json`,
            { type: "application/json;charset=utf-8" }
        );
        saveAs(expressionFile);
    };
    const importExpression = async (importedFile: File) => {
        // Get File Content
        const fileContent = await importedFile.text();
        // Parse as Object
        const expressionDB: ExpressionDBEntry = JSON.parse(fileContent);
        // Add expression to database
        const db = await useDatabase();
        await db.add(FLWarriorDBTables.EXPRESSION, expressionDB);
        await loadExpressionsFromDB();
    };
    // Fetch Data
    useAsyncEffect(loadExpressionsFromDB, []);
    const expressionsListDataSource = useMemo(
        () =>
            expressionsList.map((expression) => ({
                id: expression.id,
                name: expression.name,
                avatar: <RegexAvatar />,
                onEdit: editExpression,
                onDelete: deletEexpression,
                onExport: exportExpression,
            })),
        [expressionsList]
    );
    // Fetch Data
    return (
        <>
            <Layout>
                <ExpressionssList>
                    <PageHeader
                        onBack={history.goBack}
                        title="Expressões Regulares"
                        subTitle="Listagem"
                        extra={[
                            <Button
                                type="primary"
                                key="button-lexical"
                                onClick={lexicalAnalysis}
                            >
                                Analizador Léxico
                            </Button>,
                            <Button
                                type="primary"
                                key="button-create"
                                onClick={createExpression}
                            >
                                Criar Expressão
                            </Button>,
                            <Upload
                                key="button-import"
                                showUploadList={false}
                                accept="application/json"
                                beforeUpload={() => false}
                                onChange={(changeEvent) =>
                                    importExpression(
                                        (changeEvent.file as unknown) as File
                                    )
                                }
                            >
                                <Button type="dashed">Importar</Button>
                            </Upload>,
                        ]}
                    />
                    <RegisteredItemsList
                        dataSource={expressionsListDataSource}
                    />
                </ExpressionssList>
            </Layout>
        </>
    );
}
