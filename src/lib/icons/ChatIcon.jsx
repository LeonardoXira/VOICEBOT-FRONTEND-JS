import PropTypes from 'prop-types';

export const ChatIcon = ({ className, width, height }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width || 512}
      height={height || 512}
      className={className}
    >
      <g id="_01_align_center" data-name="01 align center">
        <path d="M24,24H12.018A12,12,0,1,1,24,11.246l0,.063ZM12.018,2a10,10,0,1,0,0,20H22V11.341A10.018,10.018,0,0,0,12.018,2Z" />
        <rect x="7" y="7" width="6" height="2" />
        <rect x="7" y="11" width="10" height="2" />
        <rect x="7" y="15" width="10" height="2" />
      </g>
    </svg>
  )
}

ChatIcon.propTypes = {
  className: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
};

ChatIcon.defaultProps = {
  width: 512,
  height: 512
};
