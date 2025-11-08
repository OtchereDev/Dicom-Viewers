import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import LegacyButton from '../LegacyButton';
import LegacyButtonGroup from '../LegacyButtonGroup';
import Typography from '../Typography';
import Select from '../Select';

const StudyListPagination = ({ onChangePage, currentPage, perPage, onChangePerPage }) => {
  const { t } = useTranslation('StudyList');

  const navigateToPage = page => {
    const toPage = page < 1 ? 1 : page;
    onChangePage(toPage);
  };

  const ranges = [
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' },
  ];
  const [selectedRange, setSelectedRange] = useState(ranges.find(r => r.value === perPage));
  const onSelectedRange = selectedRange => {
    setSelectedRange(selectedRange);
    onChangePerPage(selectedRange.value);
  };

  return (
    <div className="bg-[#0a163f] py-10 text-[#e8eaf0]">
      <div className="container relative m-auto px-8">
        <div className="flex items-center justify-between text-[#e2e8f0]">
          <div className="flex items-center">
            <Select
              id="rows-per-page"
              className="relative mr-3 w-24 border-[#2a3654] bg-[#1a2654] text-[#e8eaf0] hover:border-[#c4d82e] focus:border-[#c4d82e]"
              options={ranges}
              value={selectedRange}
              isMulti={false}
              isClearable={false}
              isSearchable={false}
              closeMenuOnSelect={false}
              hideSelectedOptions={true}
              onChange={onSelectedRange}
            />
            <Typography className="text-base text-[#9ca3af]">{t('Results per page')}</Typography>
          </div>

          <div>
            <div className="flex items-center space-x-4">
              <Typography className="text-base text-[#9ca3af]">
                {t('Page')} <span className="text-[#60a5fa]">{currentPage}</span>
              </Typography>

              {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
              <LegacyButtonGroup className="space-x-2">
                <LegacyButton
                  size="initial"
                  className="border-[#2a3654] px-4 py-2 text-base text-[#e8eaf0] hover:border-[#c4d82e] hover:text-[#c4d82e]"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(1)}
                >
                  {`<<`}
                </LegacyButton>
                <LegacyButton
                  size="initial"
                  className="border-[#2a3654] px-4 py-2 text-base text-[#e8eaf0] hover:border-[#c4d82e] hover:text-[#c4d82e]"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(currentPage - 1)}
                >
                  {t('Previous')}
                </LegacyButton>
                <LegacyButton
                  size="initial"
                  className="border-[#2a3654] px-4 py-2 text-base text-[#e8eaf0] hover:border-[#c4d82e] hover:text-[#c4d82e]"
                  color="translucent"
                  border="primary"
                  variant="outlined"
                  onClick={() => navigateToPage(currentPage + 1)}
                >
                  {t('Next')}
                </LegacyButton>
              </LegacyButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

StudyListPagination.propTypes = {
  onChangePage: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  perPage: PropTypes.number.isRequired,
  onChangePerPage: PropTypes.func.isRequired,
};

export default StudyListPagination;
