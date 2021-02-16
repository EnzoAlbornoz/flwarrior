// Import Dependencies
import type { FunctionComponent } from "react";
import { List } from "antd";
// Define Types
export interface IRegisteredItemsListItemProps {
    name: string;
    onEdit: (itemId: string) => void;
}
// Define Component
const RegisteredItemsListItem: FunctionComponent<IRegisteredItemsListItemProps> = ({
    name,
}) => {
    return (
        <>
            <List.Item>
                <List.Item.Meta title={name} />
            </List.Item>
        </>
    );
};
// Export Component
export default RegisteredItemsListItem;
