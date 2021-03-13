// Import Dependencies
import {
    PageHeader,
    List,
    Button,
    Typography,
    Checkbox,
    Modal,
    Select,
} from "antd";
import IconBase, { SaveOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import deepEqual from "deep-equal";
import Layout from "@layout";
import useAsyncEffect from "@/utils/useAsyncEffect";
import { useDatabase } from "@database";
import { FLWarriorDBTables } from "@database/schema";
import type {
    MachineDBEntry,
    MachineDBEntryState,
} from "@database/schema/machine";
import type { ArrayElement } from "@/utils/ArrayElement";
import { useModal } from "@components/TextModalInput";
import { ReactComponent as RightArrowRaw } from "@assets/right-arrow.svg";
import { machineIsDeterministic } from "@/lib/utils";
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
const NewTransitionModaContent = styled.section`
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
    const [machineDb, setMachineDb] = useState<MachineDBEntry>();
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGEditPageProps>();
    // Fetch Data
    useAsyncEffect(async () => {
        const db = await useDatabase();
        const machinerEntry = await db.get(FLWarriorDBTables.MACHINE, idToEdit);
        setMachineDb(machinerEntry);
    }, []);
    // Define Computed Values
    const states = useMemo(() => machineDb?.states, [machineDb?.states]);
    const alphabet = useMemo(() => machineDb?.entryAlphabet, [
        machineDb?.entryAlphabet,
    ]);
    const transitions = useMemo(() => machineDb?.transitions, [
        machineDb?.transitions,
    ]);
    const initialState = useMemo(
        () => machineDb?.states?.find((s) => s.isEntry)?.id,
        [machineDb?.states]
    );
    // Components Handlers
    const renameMachine = (newName: string) => {
        setMachineDb((machine) => {
            return { ...machine, name: newName };
        });
    };
    const saveMachine = async () => {
        // Fetch Database
        const db = await useDatabase();
        await db.put(FLWarriorDBTables.MACHINE, machineDb);
    };
    const newState = (stateName: string) => {
        setMachineDb((machine) => {
            if (machine.states.findIndex((s) => s.id === stateName) === -1) {
                machine.states.push({
                    id: stateName,
                    isEntry: false,
                    isExit: false,
                });
            }
            return { ...machine };
        });
    };
    const deleteState = (stateName: string) => {
        setMachineDb((machine) => {
            const stateToDeleteIdx = machine.states.findIndex(
                (s) => s.id === stateName
            );
            if (stateToDeleteIdx >= 0) {
                machine.states.splice(stateToDeleteIdx, 1);
            }
            return { ...machine };
        });
    };
    const addAlphabetSymbol = (newSymbol: string) => {
        setMachineDb((machine) => {
            if (!machine.entryAlphabet.includes(newSymbol)) {
                machine.entryAlphabet.push(newSymbol);
            }
            return { ...machine };
        });
    };
    const deleteAlphabetSymbol = (symbolToDelete: string) => {
        setMachineDb((machine) => {
            const symbolToDeleteIdx = machine.entryAlphabet.findIndex(
                (as) => as === symbolToDelete
            );
            if (symbolToDeleteIdx >= 0) {
                machine.entryAlphabet.splice(symbolToDeleteIdx, 1);
            }
            return { ...machine };
        });
    };
    const addNewTransition = (from: string, to: string, withSymbol: string) => {
        if (
            machineDb.transitions.findIndex(
                (t) =>
                    t.from === from &&
                    t.to.newState === to &&
                    t.with.head === withSymbol
            ) === -1
        ) {
            setMachineDb((machine) => {
                machine.transitions.push({
                    from,
                    to: {
                        newState: to,
                        headDirection: null,
                        writeSymbol: null,
                    },
                    with: {
                        head: withSymbol,
                        memory: null,
                    },
                });
                return {
                    ...machine,
                    deterministic: machineIsDeterministic(machine),
                };
            });
        }
    };
    const deleteTransition = (
        transition: ArrayElement<MachineDBEntry["transitions"]>
    ) => {
        const toDeleteIdx = machineDb.transitions.findIndex((t) =>
            deepEqual(t, transition)
        );
        if (toDeleteIdx >= 0) {
            setMachineDb((machine) => {
                machine.transitions.splice(toDeleteIdx, 1);
                return {
                    ...machine,
                    deterministic: machineIsDeterministic(machine),
                };
            });
        }
    };
    const setInitalState = (state: string) => {
        setMachineDb((machine) => {
            return {
                ...machine,
                states: machine.states.map((s) => ({
                    ...s,
                    isEntry: s.id === state,
                })),
            };
        });
    };
    const setIsExitState = (state: string, isExitState: boolean) => {
        const stateIdx = machineDb.states.findIndex((s) => s.id === state);
        setMachineDb((machine) => {
            // eslint-disable-next-line no-param-reassign
            machine.states[stateIdx].isExit = isExitState;
            return { ...machine };
        });
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
        onSubmit: addAlphabetSymbol,
        placeholder: "Insira o novo símbolo",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length !== 1,
    });
    const [showModalRename, modalRenameCH] = useModal({
        title: "Renomear Autômato",
        onSubmit: renameMachine,
        placeholder: machineDb?.name,
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
                        title={`Editar - ${machineDb?.name || idToEdit}`}
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

                                    <Button
                                        key="button-new-rule"
                                        type="primary"
                                        onClick={showNewTransitionModal}
                                    >
                                        Adicionar Transição
                                    </Button>
                                </RulesListHeader>
                            }
                            style={{ gridArea: "rules" }}
                            dataSource={transitions}
                            renderItem={(
                                item: ArrayElement<
                                    MachineDBEntry["transitions"]
                                >,
                                index
                            ) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Button
                                            danger
                                            key="remove-rule"
                                            onClick={() =>
                                                deleteTransition(item)
                                            }
                                        >
                                            Deletar Transição
                                        </Button>,
                                    ]}
                                >
                                    <RuleHead>
                                        <Typography.Text strong>
                                            {item.from}[{item.with.head}]
                                        </Typography.Text>
                                        <RightArrow />
                                    </RuleHead>
                                    <RuleBody>{item.to.newState}</RuleBody>
                                </List.Item>
                            )}
                        />
                        <AlphabetList
                            dataSource={states}
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
                            renderItem={(state: MachineDBEntryState, index) => (
                                <List.Item
                                    key={index}
                                    actions={[
                                        <Checkbox
                                            key="button-exit-state"
                                            checked={state.isExit}
                                            onChange={() =>
                                                setIsExitState(
                                                    state.id,
                                                    !state.isExit
                                                )
                                            }
                                        >
                                            Saída ?
                                        </Checkbox>,
                                        <Button
                                            key="button-delete-state"
                                            onClick={() =>
                                                deleteState(state.id)
                                            }
                                            danger
                                        >
                                            Deletar
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta title={state.id} />
                                </List.Item>
                            )}
                        />
                        <SelectBar style={{ gridArea: "entry" }}>
                            <Typography.Text>Estado de Entrada</Typography.Text>
                            <Select
                                defaultActiveFirstOption
                                value={initialState}
                                onChange={(state) =>
                                    setInitalState(state.toString())
                                }
                            >
                                {states?.map((state) => (
                                    <Select.Option
                                        value={state.id}
                                        key={state.id}
                                    >
                                        {state.id}
                                    </Select.Option>
                                ))}
                            </Select>
                        </SelectBar>
                        <AlphabetList
                            dataSource={alphabet}
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
                        <NewTransitionModaContent>
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
                                        value={state.id}
                                        key={state.id}
                                    >
                                        {state.id}
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
                                        value={state.id}
                                        key={state.id}
                                    >
                                        {state.id}
                                    </Select.Option>
                                ))}
                            </Select>
                        </NewTransitionModaContent>
                    </Modal>
                </MachineEditContent>
            </Layout>
        </>
    );
}
