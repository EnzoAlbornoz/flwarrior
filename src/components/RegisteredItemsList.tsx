// Import Dependencies
import { memo as memoize } from "react";
import type { FunctionComponent, HTMLAttributes } from "react";
import { List } from "antd";
import ListItem from "./RegisteredItemsListItem";
// Define Types
export type IRegisteredItemsListProps = Pick<
    HTMLAttributes<HTMLElement>,
    "className"
>;
// Define Sizings
// Define Component
const RegisteredItemsList: FunctionComponent<IRegisteredItemsListProps> = ({
    className,
}) => {
    return (
        <List
            bordered
            className={className}
            itemLayout="horizontal"
            pagination={{
                position: "bottom",
                style: { textAlign: "center" },
                pageSize: 14,
            }}
            renderItem={ListItem}
            dataSource={[
                { name: "Binário Ímpar, múltiplo de 3", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 4", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 5", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 6", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 3", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 4", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 5", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 6", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 3", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 4", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 5", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 7", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 3", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 4", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 5", onEdit: () => {} },
                { name: "Binário Ímpar, múltiplo de 7", onEdit: () => {} },
            ]}
        />
    );
};
// Export Component
export default memoize(RegisteredItemsList);
