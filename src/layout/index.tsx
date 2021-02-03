// Import Dependencies
import styled from "styled-components";
import { Layout } from "antd";

const { Content, Footer, Header, Sider } = Layout;
// Define Style
const RootLayout = styled(Layout)`
    min-width: 100vw;
`;
// Define Component
export default function AppLayout(): JSX.Element {
    return (
        <RootLayout>
            <Sider>left sidebar</Sider>
            <Layout>
                <Header>header</Header>
                <Content>main content</Content>
                <Footer>footer</Footer>
            </Layout>
        </RootLayout>
    );
}
