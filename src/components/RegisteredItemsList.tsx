// Import Dependencies
import { memo as memoize } from "react";
import type { FunctionComponent, HTMLAttributes } from "react";
import { List } from "antd";
import ListItem from "./RegisteredItemsListItem";
import type { IRegisteredItemsListItemProps } from "./RegisteredItemsListItem";
// Define Types
export interface IRegisteredItemsListProps
    extends Pick<HTMLAttributes<HTMLElement>, "className"> {
    dataSource: Array<IRegisteredItemsListItemProps>;
}
// Define Sizings
// Define Component
const RegisteredItemsList: FunctionComponent<IRegisteredItemsListProps> = ({
    className,
    dataSource,
}) => {
    return (
        <List
            className={className}
            itemLayout="horizontal"
            pagination={{
                position: "bottom",
                style: { textAlign: "center" },
                pageSize: 11,
            }}
            renderItem={ListItem}
            dataSource={dataSource}
        />
    );
};
// Export Component
export default memoize(RegisteredItemsList);
