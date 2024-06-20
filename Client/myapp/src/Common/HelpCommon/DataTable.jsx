import React from "react";

const DataTable = ({ itemsToDisplay, selectedRowIndex, handleRecordDoubleClick, setSelectedRowIndex }) => {
    return (
        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Ac Code</th>
                        <th>Ac_Name_E</th>
                        <th>Ac_type</th>
                        <th>Gst_No</th>
                        <th>cityname</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsToDisplay.map((item, index) => (
                        <tr
                            key={index}
                            className={selectedRowIndex === index ? "selected-row" : ""}
                            onDoubleClick={() => handleRecordDoubleClick(item)}
                        >
                            <td>{item.Ac_Code}</td>
                            <td>{item.Ac_Name_E}</td>
                            <td>{item.Ac_type}</td>
                            <td>{item.Gst_No}</td>
                            <td>{item.cityname}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
