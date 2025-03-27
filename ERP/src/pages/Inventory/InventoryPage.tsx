import GreenButton from '../../components/button/GreenButton';
import PrimaryButton from '../../components/button/PrimaryButton';
import { FaPlus } from 'react-icons/fa6';
import { FaFileArrowUp } from 'react-icons/fa6';
import InputField from '../../components/inputfiled/InputField';
const InventoryPage = () => {
    return (
        <div>
            <h1>재고 관리</h1>
            <GreenButton text="상품 추가" icon={<FaPlus size={16} />} onClick={() => alert('상품 추가')} />
            <PrimaryButton
                text="POS 데이터 업로드"
                icon={<FaFileArrowUp size={16} />}
                onClick={() => alert('데이터 업로드')}
            />
            <InputField />
        </div>
    );
};

export default InventoryPage;
