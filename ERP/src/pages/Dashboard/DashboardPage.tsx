import AlertCard from "../../components/common/AlertCard";

const DashboardPage = () => {

    return (
        <div>
            <h1>대시보드</h1>
            <AlertCard
        productName="텀블러 (블랙)"
        productCode="P0023"
        stock={5}
        avgSales={3}
        orderDeadline="7일"
      />
        </div>
    );
}

export default DashboardPage;
