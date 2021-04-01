// Import Dependencies
import {
    PageHeader,
    List,
    Button,
    Typography,
    Checkbox,
    Modal,
    Select,
    Space,
} from "antd";
import IconBase, { SaveOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import Layout from "@layout";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import { useModal } from "@components/TextModalInput";
import { ReactComponent as RightArrowRaw } from "@assets/right-arrow.svg";
import {
    IIMachine,
    IMachine,
    fromDBEntry,
    toDBEntry,
    rename,
    addState,
    removeState,
    addAlphabetSymbol,
    removeAlphabetSymbol,
    addTransition,
    ITransition,
    removeTransition,
    setEntryState,
    setAsExitState,
    setAsNonExitState,
    IITransition,
    determinize,
} from "@lib/automaton/Machine";
import { getNewState, IIState, IState } from "@/lib/automaton/State";
// Define Typings
export interface ITGEditPageProps {
    id: string;
}
// Define Style
const MachineEditContent = styled.section`
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
const MachineEditGrid = styled.section`
    /* Full Height */
    flex-grow: 1;
    /* Align center */
    width: calc(100% - 48px);
    margin: 1.5rem auto;
    /* Display on Grid */
    display: grid;
    gap: 1rem;
    grid-template-columns: 8fr 2fr;
    grid-template-rows: 1fr 5fr 6fr;
    grid-template-areas:
        "rules entry"
        "rules states"
        "rules alphabet";
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
const NewTransitionModalContent = styled.section`
    display: grid;
    column-gap: 1rem;

    grid-template-rows: 1fr 1fr;
    grid-template-columns: repeat(3, 1fr);
`;
const RulesListHeader = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
const SelectBar = styled.section`
    display: flex;
    flex-direction: column;
`;
// Define Page
export default function RegularMachineEdit(): JSX.Element {
    // Setup State
    const [machine, setMachine] = useState<IIMachine>();
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const machinerEntry = await db.get(FLWarriorDBTables.MACHINE, idToEdit);
        const machineLib = fromDBEntry(machinerEntry);
        setMachine(machineLib);
    }, []);
    // Define Computed Values
    const name = useMemo(() => machine?.get("name") as IMachine["name"], [
        machine,
    ]);
    const states = useMemo(() => machine?.get("states") as IMachine["states"], [
        machine,
    ]);
    const alphabet = useMemo(
        () => machine?.get("alphabet") as IMachine["alphabet"],
        [machine]
    );
    const transitions = useMemo(
        () => machine?.get("transitions") as IMachine["transitions"],
        [machine]
    );
    const initialState = useMemo(
        () =>
            (machine?.get("states") as IMachine["states"])?.find(
                (s) => !!s.get("isEntry")
            ),
        [machine]
    );
    // Components Handlers
    const renameMachine = (newName: string) =>
        setMachine(rename(machine, newName));

    const saveMachine = async () => {
        // Build Serialized Machine
        const serializedMachine = toDBEntry(machine);
        // Fetch Database
        const db = await useDatabase();
        await db.put(FLWarriorDBTables.MACHINE, serializedMachine);
    };
    const newState = (stateName: string) =>
        setMachine(addState(machine, getNewState(stateName)));

    const deleteState = (stateRef: IState) =>
        setMachine(removeState(machine, stateRef));

    const addNewAlphabetSymbol = (newSymbol: string) =>
        setMachine(addAlphabetSymbol(machine, newSymbol));

    const deleteAlphabetSymbol = (symbol: string) =>
        setMachine(removeAlphabetSymbol(machine, symbol));

    const addNewTransition = (from: string, to: string, withSymbol: string) =>
        setMachine(
            addTransition(machine, {
                from,
                to,
                with: withSymbol,
                pop: null,
                push: null,
            })
        );
    const deleteTransition = (transitionRef: ITransition) =>
        setMachine(removeTransition(machine, transitionRef));
    const setInitalState = (stateRef: IState) =>
        setMachine(setEntryState(machine, stateRef));
    const setIsExitState = (stateRef: IState, isExitState: boolean) =>
        setMachine(
            isExitState
                ? setAsExitState(machine, stateRef)
                : setAsNonExitState(machine, stateRef)
        );
    // Special Functions
    const determinizeMachine = () => {
        setMachine(determinize(machine));
    };
    // Setup Modals
    const [showModalState, modalStateCH] = useModal({
        title: "Adicionar estado",
        onSubmit: newState,
        placeholder: "Insira o nome do novo estado",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length < 1,
    });
    const [showModalAlphabetSymbol, modalAlphabetSymbolCH] = useModal({
        title: "Adicionar símbolo ao alfabeto",
        onSubmit: addNewAlphabetSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1,
    });
    const [showModalRename, modalRenameCH] = useModal({
        title: "Renomear Autômato",
        onSubmit: renameMachine,
        placeholder: name,
        submitText: "Renomear",
        submitDisabled: (ci) => !(ci.length >= 1),
    });
    const [newTransFrom, setNewTransFrom] = useState<string>();
    const [newTransTo, setNewTransTo] = useState<string>();
    const [newTransWith, setNewTransWith] = useState<string>();
    const [modalNewTransitionVisible, setModalNewTransitionVisible] = useState(
        false
    );
    const showNewTransitionModal = () => {
        setNewTransFrom(undefined);
        setNewTransTo(undefined);
        setNewTransWith(undefined);
        setModalNewTransitionVisible(true);
    };
    // Render Page
    return (
        <>
            <Layout>
                <>
                    {/* Modals */}
                    {modalRenameCH}
                    {modalStateCH}
                    {modalAlphabetSymbolCH}
                </>
                <MachineEditContent>
                    <PageHeader
                        onBack={history.goBack}
                        title={`Editar - ${name || idToEdit}`}
                        subTitle="Autômato Finito"
                        extra={[
                            <Button
                                key="button-rename"
                                onClick={showModalRename}
                                type="dashed"
                            >
                                Renomear
                            </Button>,
                            <Button
                                key="button-save"
                                onClick={saveMachine}
                                icon={<SaveOutlined />}
                            >
                                Salvar
                            </Button>,
                        ]}
                    />
                    <MachineEditGrid>
                        {/* List of Transitions */}
                        <RulesList
                            bordered
                            header={
                                <RulesListHeader>
                                    <Typography.Text>
                                        Regras de Transição
                                    </Typography.Text>

                                    <Space>
                                        <Button
                                            key="button-determinize"
                                            type="primary"
                                            onClick={determinizeMachine}
                                        >
                                            Determinizar
                                        </Button>
                                        <Button
                                            key="button-new-rule"
                                            type="primary"
                                            onClick={showNewTransitionModal}
                                        >
                                            Adicionar Transição
                                        </Button>
                                    </Space>
                                </RulesListHeader>
                            }
                            style={{ gridArea: "rules" }}
                            dataSource={transitions?.toArray()}
                            renderItem={(item: IITransition, index) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Button
                                            danger
                                            key="remove-rule"
                                            onClick={() =>
                                                deleteTransition(
                                                    item.toObject() as ITransition
                                                )
                                            }
                                        >
                                            Deletar Transição
                                        </Button>,
                                    ]}
                                >
                                    <RuleHead>
                                        <Typography.Text strong>
                                            {item.get("from")}[
                                            {item.get("with")}]
                                        </Typography.Text>
                                        <RightArrow />
                                    </RuleHead>
                                    <RuleBody>{item.get("to")}</RuleBody>
                                </List.Item>
                            )}
                        />
                        <AlphabetList
                            dataSource={states?.toList()?.toArray()}
                            style={{
                                gridArea: "states",
                            }}
                            bordered
                            header={
                                <AlphabetListHeader>
                                    <Typography.Text>Estados</Typography.Text>
                                    <Button onClick={showModalState}>
                                        Adicionar
                                    </Button>
                                </AlphabetListHeader>
                            }
                            renderItem={(state: IIState, index) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Checkbox
                                            key="button-exit-state"
                                            checked={
                                                state?.get("isExit") as boolean
                                            }
                                            onChange={() =>
                                                setIsExitState(
                                                    state.toObject() as IState,
                                                    !state.get("isExit")
                                                )
                                            }
                                        >
                                            Saída ?
                                        </Checkbox>,
                                        <Button
                                            key="button-delete-state"
                                            onClick={() =>
                                                deleteState(
                                                    state.toObject() as IState
                                                )
                                            }
                                            danger
                                        >
                                            Deletar
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta title={state.get("id")} />
                                </List.Item>
                            )}
                        />
                        <SelectBar style={{ gridArea: "entry" }}>
                            <Typography.Text>Estado de Entrada</Typography.Text>
                            <Select
                                defaultActiveFirstOption
                                value={initialState?.get("id") as string}
                                onChange={(stateId) =>
                                    setInitalState(
                                        states.get(stateId).toObject() as IState
                                    )
                                }
                            >
                                {states?.valueSeq()?.map((state) => (
                                    <Select.Option
                                        value={state.get("id") as string}
                                        key={state.get("id") as string}
                                    >
                                        {state.get("id") as string}
                                    </Select.Option>
                                ))}
                            </Select>
                        </SelectBar>
                        <AlphabetList
                            dataSource={alphabet?.toArray()}
                            style={{
                                gridArea: "alphabet",
                            }}
                            bordered
                            header={
                                <AlphabetListHeader>
                                    <Typography.Text>Alfabeto</Typography.Text>
                                    <Button onClick={showModalAlphabetSymbol}>
                                        Adicionar
                                    </Button>
                                </AlphabetListHeader>
                            }
                            renderItem={(alphabetSymbol: string, index) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Button
                                            onClick={() =>
                                                deleteAlphabetSymbol(
                                                    alphabetSymbol
                                                )
                                            }
                                            danger
                                        >
                                            Deletar
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta title={alphabetSymbol} />
                                </List.Item>
                            )}
                        />
                    </MachineEditGrid>
                    <Modal
                        title="Adicionar nova transição"
                        centered
                        visible={modalNewTransitionVisible}
                        okText="Adicionar"
                        cancelText="Cancelar"
                        okButtonProps={{
                            disabled: !(
                                newTransFrom?.length > 0 &&
                                newTransWith?.length > 0 &&
                                newTransTo?.length > 0
                            ),
                        }}
                        onOk={() => (
                            setModalNewTransitionVisible(false),
                            addNewTransition(
                                newTransFrom,
                                newTransTo,
                                newTransWith
                            )
                        )}
                        onCancel={() => setModalNewTransitionVisible(false)}
                    >
                        <NewTransitionModalContent>
                            <Typography.Text>De (Estado):</Typography.Text>
                            <Typography.Text>Lendo (Símbolo):</Typography.Text>
                            <Typography.Text>Para (Estado):</Typography.Text>
                            <Select
                                value={newTransFrom}
                                defaultActiveFirstOption
                                onChange={(from) =>
                                    setNewTransFrom(from.toString())
                                }
                            >
                                {states?.map((state) => (
                                    <Select.Option
                                        value={state.get("id") as string}
                                        key={state.get("id") as string}
                                    >
                                        {state.get("id") as string}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Select
                                value={newTransWith}
                                defaultActiveFirstOption
                                onChange={(withSymbol) =>
                                    setNewTransWith(withSymbol.toString())
                                }
                            >
                                {alphabet?.map((alphabetSymbol) => (
                                    <Select.Option
                                        value={alphabetSymbol}
                                        key={alphabetSymbol}
                                    >
                                        {alphabetSymbol}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Select
                                defaultActiveFirstOption
                                value={newTransTo}
                                onChange={(to) => setNewTransTo(to.toString())}
                            >
                                {states?.map((state) => (
                                    <Select.Option
                                        value={state.get("id") as string}
                                        key={state.get("id") as string}
                                    >
                                        {state.get("id") as string}
                                    </Select.Option>
                                ))}
                            </Select>
                        </NewTransitionModalContent>
                    </Modal>
                </MachineEditContent>
            </Layout>
        </>
    );
}
