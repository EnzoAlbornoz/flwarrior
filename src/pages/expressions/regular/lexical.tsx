// Import Dependencies
import styled from "styled-components";
import type { FunctionComponent } from "react";
import { useHistory } from "react-router-dom";
import { Button, PageHeader, List, Typography, Input } from "antd";
import Layout from "@layout";
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
    height: 100%;
    resize: none;
`;
const SymbolsTableArea = styled.section`
    grid-area: tokens;
`;
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
// Define Page
const ExpressionLexicalPage: FunctionComponent = () => {
    // Fetch Context
    const history = useHistory();
    // Render Page
    return (
        <>
            <Layout>
                <LexicalAnalyzer>
                    <PageHeader
                        onBack={history.goBack}
                        title="Analizador Léxico"
                        subTitle="Expressões Regulares"
                        extra={[]}
                    />
                    <LexicalAnalyzerBody>
                        <TextUnderAnalysisArea>
                            <InputTextArea />
                        </TextUnderAnalysisArea>
                        <DefinitionsList
                            bordered
                            header={
                                <DefinitionsListHeader>
                                    <Typography.Text>
                                        Definições Regulares
                                    </Typography.Text>
                                    <Button onClick={undefined}>
                                        Importar Expressão
                                    </Button>
                                </DefinitionsListHeader>
                            }
                        />
                        <SymbolsTableArea>tokens</SymbolsTableArea>
                    </LexicalAnalyzerBody>
                </LexicalAnalyzer>
            </Layout>
        </>
    );
};
// Export Page
export default ExpressionLexicalPage;
