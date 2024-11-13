const ImageShow = ({ image, setSelectedImage }) => {

    const handleSelectImage = (img) => {
        setSelectedImage(`http://localhost:1105/api/v1/${img.fileUrl}`);
    }
    if (image.length === 0) return null;
    if (image.length === 1) {
        return (
            image.map((img, index) => (
                <div key={index} >
                    <img src={`http://localhost:1105/api/v1/${img.fileUrl}`} alt="attachment" className="h-96 w-96 object-cover rounded" onClick={() => handleSelectImage(img)} />
                </div>
            ))
        );
    }
    if (image.length === 2) {
        return (
            <div className={`flex items-center space-x-2 `}>
                {image.map((img, index) => (
                    <div key={index} >
                        <img src={`http://localhost:1105/api/v1/${img.fileUrl}`} alt="attachment" className="h-48 w-48 object-cover rounded" onClick={() => handleSelectImage(img)} />
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-3 gap-2">
            {image.map((img, index) => (
                <div key={index} >
                    <img
                        src={`http://localhost:1105/api/v1/${img.fileUrl}`}
                        alt="attachment"
                        className="h-32 w-32 object-cover rounded"
                        onClick={() => handleSelectImage(img)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ImageShow;