// Import Dependencies
import Immutable from "immutable";
import { useDatabase } from "@/database";
import { FLWarriorDBTables } from "@/database/schema";
import {
    fromDBEntry,
    IIMachine,
    IITransition,
    IMachine,
} from "@/lib/automaton/Machine";
import useAsyncEffect from "@/utils/useAsyncEffect";
import Layout from "@layout";
import { Button, Card, PageHeader, Statistic, Timeline } from "antd";
import { useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import { nextStep } from "@lib/automaton/Machine";
import { EPSILON } from "@/lib/AlphabetSymbol";
import { useModal } from "@/components/TextModalInput";
// Import Types
interface ITGExecutePageProps {
    id: string;
}
enum IHystoricRecordType {
    ACCEPT,
    REJECT,
    TRANSIT,
    START,
}
interface IHystoricRecord {
    id: number;
    currentState: string;
    type: IHystoricRecordType;
    transition?: IITransition;
}
type IIHystoricRecord = Immutable.Map<
    keyof IHystoricRecord,
    IHystoricRecord[keyof IHystoricRecord]
>;
// Define Styles
const MachineExecution = styled.section`
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const Execution = styled.section`
    display: flex;
    /* Align center */
    width: calc(100% - 48px);
    height: 100%;
    margin: 1.5rem auto;
    /* Display on Grid */
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 8fr;
    grid-template-areas:
        "control"
        "history";
`;
const ControlBar = styled.section`
    display: flex;
    grid-area: "control";
`;
// Define Page
export default function ExecuteFiniteAutomata(): JSX.Element {
    // Setup State
    const [machine, setMachine] = useState<IIMachine>();
    const [walker, setWalker] = useState<Generator<IITransition, boolean>>(
        null
    );
    const [transitionsHistory, setTransitionsHistory] = useState<
        Immutable.List<IIHystoricRecord>
    >(Immutable.List());
    const [machineInput, setMachineInput] = useState<string>("");
    const [machineMemory, setMachineMemory] = useState<string>("");
    // Get Context
    const history = useHistory();
    const { id: idToEdit } = useParams<ITGExecutePageProps>();
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
    const initialState = useMemo(
        () =>
            (machine?.get("states") as IMachine["states"])
                ?.find((s) => !!s.get("isEntry"))
                .get("id"),
        [machine]
    );
    const machineRunning = useMemo(() => transitionsHistory.size > 0, [
        transitionsHistory,
    ]);
    const machineFinished = useMemo(
        () =>
            [IHystoricRecordType.ACCEPT, IHystoricRecordType.REJECT].includes(
                transitionsHistory
                    ?.last<IIHystoricRecord>()
                    ?.get("type") as IHystoricRecordType
            ),
        [transitionsHistory]
    );
    const currentStatus = useMemo(() => {
        const hEntry = transitionsHistory
            ?.last<IIHystoricRecord>()
            ?.get("type");
        switch (hEntry) {
            case IHystoricRecordType.START:
                return "INÍCIO";
            case IHystoricRecordType.TRANSIT:
                return "EXECUTANDO";
            case IHystoricRecordType.ACCEPT:
                return "ACEITO";
            case IHystoricRecordType.REJECT:
                return "REJEITADO";
            default:
                return "-";
        }
    }, [transitionsHistory]);
    const currentState = useMemo(
        () =>
            (transitionsHistory
                ?.last<IIHystoricRecord>()
                ?.get("currentState") as string) || "-",
        [transitionsHistory]
    );
    // Define Methods
    const redefineMachine = () => (
        setMachineMemory(""),
        setTransitionsHistory(Immutable.List()),
        setWalker(null)
    );
    const startMachine = () => {
        // Copy Entry To Memory
        setMachineMemory(machineInput);
        setWalker(nextStep(machine, machineMemory));
        // Define Start Historic
        const firstEntry = Immutable.Map({
            currentState: initialState,
            type: IHystoricRecordType.START,
        }) as IIHystoricRecord;
        setTransitionsHistory(Immutable.List([firstEntry]));
    };
    const setMachineEntryWord = (word: string) => {
        setMachineInput(word);
        setMachineMemory(word);
    };
    const executeStep = () => {
        // Fetch Step
        const next = walker.next();
        if (next.done) {
            // Machine stopped (Accepted or rejected)
            setMachineMemory("-");
            setTransitionsHistory(
                transitionsHistory.push(
                    Immutable.Map({
                        id: transitionsHistory.size,
                        type: next.value
                            ? IHystoricRecordType.ACCEPT
                            : IHystoricRecordType.REJECT,
                        currentState,
                    }) as IIHystoricRecord
                )
            );
        } else {
            // Decrease Memory Data
            setMachineMemory(machineMemory.slice(1) || "-");
            // Add Record
            setTransitionsHistory(
                transitionsHistory.push(
                    Immutable.Map({
                        id: transitionsHistory.size,
                        type: IHystoricRecordType.TRANSIT,
                        currentState: (next.value as IITransition).get("to"),
                        transition: next.value,
                    }) as IIHystoricRecord
                )
            );
        }
    };
    // Define Modals
    const [showModalMachineInput, modalMachineInput] = useModal({
        title: "Adicionar entrada à maquina",
        onSubmit: setMachineEntryWord,
        placeholder: "Insira a entrada",
        submitText: "Adicionar",
        submitDisabled: (ci) => ci.length <= 0,
    });
    // Define Computed Components
    const timelineItems = useMemo(
        () =>
            transitionsHistory.map((record) => {
                switch (record.get("type") as IHystoricRecordType) {
                    case IHystoricRecordType.START:
                        return (
                            <Timeline.Item
                                color="gray"
                                key={record.get("id") as number}
                            >
                                Máquina inicia no estado <b>{initialState}</b>
                            </Timeline.Item>
                        );
                    case IHystoricRecordType.TRANSIT:
                        return (
                            <Timeline.Item key={record.get("id") as number}>
                                Máquina transita do estado{" "}
                                <b>
                                    {(record.get(
                                        "transition"
                                    ) as IITransition).get("from")}
                                </b>{" "}
                                para o estado{" "}
                                <b>
                                    {(record.get(
                                        "transition"
                                    ) as IITransition).get("to")}
                                </b>{" "}
                                após ler{" "}
                                <b>
                                    {(record.get(
                                        "transition"
                                    ) as IITransition).get("with")}
                                </b>
                            </Timeline.Item>
                        );
                    case IHystoricRecordType.ACCEPT:
                        return (
                            <Timeline.Item
                                color="green"
                                key={record.get("id") as number}
                            >
                                Máquina aceita a entrada
                            </Timeline.Item>
                        );
                    case IHystoricRecordType.REJECT:
                        return (
                            <Timeline.Item
                                color="red"
                                key={record.get("id") as number}
                            >
                                Máquina rejeita a entrada
                            </Timeline.Item>
                        );
                    default:
                        return <></>;
                }
            }),
        [transitionsHistory]
    );
    // Render Page
    return (
        <>
            <Layout>
                <MachineExecution>
                    <PageHeader
                        onBack={history.goBack}
                        title={`Executar - ${name || idToEdit}`}
                        subTitle="Automato Finito"
                        extra={[
                            <Button
                                key="btn-set-input"
                                disabled={machineRunning}
                                onClick={showModalMachineInput}
                            >
                                Definir Entrada
                            </Button>,
                            <Button
                                type="dashed"
                                key="btn-reset"
                                disabled={!machineRunning}
                                onClick={redefineMachine}
                            >
                                Redefinir
                            </Button>,
                            <Button
                                type="primary"
                                key="btn-execute"
                                disabled={machineRunning}
                                onClick={startMachine}
                            >
                                Executar
                            </Button>,
                            <Button
                                type="primary"
                                key="btn-execute-step"
                                disabled={!machineRunning || machineFinished}
                                onClick={executeStep}
                            >
                                Próximo Passo
                            </Button>,
                        ]}
                    />
                    {modalMachineInput}
                    <Execution>
                        <ControlBar>
                            <Card bordered={false}>
                                <Card.Meta
                                    title={currentState}
                                    description="Estado Atual"
                                />
                            </Card>
                            <Card bordered={false}>
                                <Card.Meta
                                    title={currentStatus}
                                    description="Status"
                                />
                            </Card>
                            <Card bordered={false}>
                                <Card.Meta
                                    title={machineMemory || EPSILON}
                                    description="Entrada"
                                />
                            </Card>
                        </ControlBar>
                        <Card title="Histórico de Execução">
                            <Timeline reverse>{timelineItems}</Timeline>
                        </Card>
                    </Execution>
                </MachineExecution>
            </Layout>
        </>
    );
}
