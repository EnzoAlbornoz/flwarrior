// Import Dependencies
import styled from "styled-components";
import { Layout, Typography, Menu } from "antd";
import IconBase, {
    PartitionOutlined,
    ReadOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import type { FunctionComponent } from "react";
import { Link } from "react-router-dom";
import { ReactComponent as KnightSVG } from "../assets/knight.svg";
import { ReactComponent as RegexSVG } from "../assets/regex.svg";

const { Content, Header: HeaderBase, Sider } = Layout;
const { Title: TitleBase } = Typography;
const { SubMenu, Item: MenuItem } = Menu;
// Define Types
// Define Style
const KnightIcon = styled(IconBase).attrs({ component: KnightSVG })`
    font-size: 2.5rem;
`;
const RegexIcon = styled(IconBase).attrs({ component: RegexSVG })``;
const RootLayout = styled(Layout)`
    min-width: 100vw;
    min-height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
`;
const Title = styled(TitleBase)`
    &&& {
        color: ${(props) =>
            props.theme === "dark" ? "@primary-color" : "#FFFFFF"};
    }
`;
const Header = styled(HeaderBase)`
    display: flex;

    align-content: center;
    align-items: center;
    justify-content: space-between;

    padding: 0 20px;

    && > * {
        margin-bottom: inherit;
        margin-top: inherit;
    }
`;
const Pane = styled.div`
    /* Variables */
    --margin-size: 2rem;
    /* Sizing */
    width: calc(100% - 2 * var(--margin-size));
    height: calc(100% - 2 * var(--margin-size));
    margin: var(--margin-size);
    /* Colors */
    background-color: white;
    /* Border */
    border-width: 1px;
    border-color: #f0f0f0;
    border-style: solid;
    border-radius: 2px;
    /* Overflow */
    & > * {
        overflow-y: auto;
    }
`;
// Define Component
const AppLayout: FunctionComponent = ({ children }) => {
    return (
        <RootLayout hasSider>
            <Sider theme="light">
                <Header>
                    <KnightIcon />
                    <Title level={3} theme="light">
                        FL Warrior
                    </Title>
                </Header>
                <Menu mode="inline">
                    <SubMenu title="Automatos" icon={<PartitionOutlined />}>
                        <MenuItem>
                            <Link to="/automata/finite">Finitos</Link>
                        </MenuItem>
                    </SubMenu>
                    <SubMenu title="Gramáticas" icon={<ReadOutlined />}>
                        <MenuItem>
                            <Link to="/grammars/regular">Regulares</Link>
                        </MenuItem>
                        <MenuItem>
                            <Link to="/grammars/context-free">
                                Livre de Contexto
                            </Link>
                        </MenuItem>
                    </SubMenu>
                    <SubMenu
                        title="Expressões"
                        icon={<RegexIcon width="2em" height="2em" />}
                    >
                        <MenuItem>
                            <Link to="/expressions/regular">Regulares</Link>
                        </MenuItem>
                    </SubMenu>
                    <SubMenu
                        title="Analizadores"
                        icon={<SearchOutlined width="2em" height="2em" />}
                    >
                        <MenuItem>
                            <Link to="/analysis/lexical">Léxico</Link>
                        </MenuItem>
                    </SubMenu>
                </Menu>
            </Sider>
            <Layout>
                <HeaderBase />
                <Content>
                    <Pane>{children}</Pane>
                </Content>
            </Layout>
        </RootLayout>
    );
};
export default AppLayout;
