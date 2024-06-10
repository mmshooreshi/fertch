import logger from '../logger.js'
export const formatTimestamp = () => {
    const date = new Date().toISOString();
    let formattedDate;
    logger.info(formattedDate)
    formattedDate = date.replace('T', '-').replace('Z', '').replace(/[:.]/g, '-');
    
    return `${formattedDate}`;
}

export default formatTimestamp;

