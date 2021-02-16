// Import Dependencies
import { Button, PageHeader } from "antd";
import { useHistory } from "react-router-dom";
import RegisteredItemsListRaw from "@components/RegisteredItemsList";
import Layout from "@layout";
import styled from "styled-components";
// Define Style
const MachinesList = styled.section`
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
    margin-left: auto;
    margin-right: auto;

    /* Pagination on End */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: scroll;
`;
// Define Component
export default function FiniteAutomata(): JSX.Element {
    const history = useHistory();
    // Fetch Data
    return (
        <>
            <Layout>
                <MachinesList>
                    <PageHeader
                        onBack={history.goBack}
                        title="Automatos Finitos"
                        subTitle="Listagem"
                        extra={[<Button>Criar Autômato</Button>]}
                    />
                    <RegisteredItemsList />
                </MachinesList>
            </Layout>
        </>
    );
}
